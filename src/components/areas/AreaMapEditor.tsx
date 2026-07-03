'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, X, MapPin, Crosshair } from 'lucide-react';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

/**
 * A town being edited: circle geofence draft. `id` present = existing DB row.
 * Null coords = legacy town created before geofencing (listed, but not on the map).
 */
export type DraftLocation = {
  id?: string;
  name: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number;
};

/** Rows that actually have a pin (drawable on the map). */
const placed = (l: DraftLocation): l is DraftLocation & { centerLat: number; centerLng: number } =>
  l.centerLat != null && l.centerLng != null;

type GeocodeHit = { name: string; placeName: string; lat: number; lng: number };

/** Build a ~64-point circle polygon (GeoJSON) around a center, radius in km. */
function circlePolygon(lng: number, lat: number, radiusKm: number): GeoJSON.Feature {
  const points = 64;
  const coords: [number, number][] = [];
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    coords.push([lng + (radiusKm / kmPerDegLng) * Math.cos(theta), lat + (radiusKm / kmPerDegLat) * Math.sin(theta)]);
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} };
}

/**
 * Mapbox editor for an area's towns-as-circle-geofences.
 * Search a place → pin drops (draggable) → radius slider; circles accumulate into
 * the area's region. Fully controlled via `locations` / `onChange`.
 */
export function AreaMapEditor({
  locations,
  onChange,
  height = '20rem',
}: {
  locations: DraftLocation[];
  onChange: (locs: DraftLocation[]) => void;
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const locationsRef = useRef(locations);
  locationsRef.current = locations;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [noHits, setNoHits] = useState(false);
  // "Drop pin" mode: next map click places a town manually — the escape hatch for
  // localities Mapbox's Nigerian data doesn't know by name (e.g. Ikate).
  const [dropMode, setDropMode] = useState(false);
  const dropModeRef = useRef(dropMode);
  dropModeRef.current = dropMode;
  const queryRef = useRef(query);
  queryRef.current = query;

  // ── init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [3.4, 6.45], // Lagos
      zoom: 10,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    // Manual placement: in drop mode, a click adds a town at that exact point.
    map.on('click', (e) => {
      if (!dropModeRef.current) return;
      const name = queryRef.current.trim() || 'New town';
      onChangeRef.current([
        ...locationsRef.current,
        {
          name,
          centerLat: Math.round(e.lngLat.lat * 1e6) / 1e6,
          centerLng: Math.round(e.lngLat.lng * 1e6) / 1e6,
          radiusKm: 2,
        },
      ]);
      setDropMode(false);
      setQuery('');
      setHits([]);
      setNoHits(false);
    });
    map.on('load', () => {
      map.addSource('coverage', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'coverage-fill', type: 'fill', source: 'coverage',
        paint: { 'fill-color': '#13C490', 'fill-opacity': 0.18 },
      });
      map.addLayer({
        id: 'coverage-line', type: 'line', source: 'coverage',
        paint: { 'line-color': '#08503C', 'line-width': 1.5, 'line-opacity': 0.6 },
      });
      setReady(true);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── drop-mode cursor (mapbox canvas overrides CSS classes) ──────────────────
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = dropMode ? 'crosshair' : '';
  }, [dropMode]);

  // ── redraw circles + markers whenever locations change ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const drawable = locations
      .map((l, i) => ({ l, i }))
      .filter((x): x is { l: DraftLocation & { centerLat: number; centerLng: number }; i: number } => placed(x.l));

    const src = map.getSource('coverage') as mapboxgl.GeoJSONSource | undefined;
    src?.setData({
      type: 'FeatureCollection',
      features: drawable.map(({ l }) => circlePolygon(l.centerLng, l.centerLat, l.radiusKm)),
    });

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = drawable.map(({ l, i }) => {
      const marker = new mapboxgl.Marker({ color: '#08503C', draggable: true })
        .setLngLat([l.centerLng, l.centerLat])
        .setPopup(new mapboxgl.Popup({ closeButton: false, offset: 20 }).setText(l.name))
        .addTo(map);
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        const next = [...locationsRef.current];
        next[i] = { ...next[i], centerLat: Math.round(lat * 1e6) / 1e6, centerLng: Math.round(lng * 1e6) / 1e6 };
        onChange(next);
      });
      return marker;
    });

    if (drawable.length) {
      const bounds = new mapboxgl.LngLatBounds();
      drawable.forEach(({ l }) => {
        const pad = l.radiusKm / 111;
        bounds.extend([l.centerLng - pad, l.centerLat - pad]);
        bounds.extend([l.centerLng + pad, l.centerLat + pad]);
      });
      map.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, ready]);

  // ── geocode search (Mapbox Geocoding API, Nigeria-bounded) ──────────────────
  // No `types` filter: Mapbox's Nigerian locality data is thin (e.g. "Ikate" only
  // exists via its streets), so streets/POIs are useful anchors — the admin picks
  // the closest hit and drags the pin. Proximity-biased to the current map view.
  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || !TOKEN) return;
    setSearching(true);
    setNoHits(false);
    try {
      const center = mapRef.current?.getCenter();
      const proximity = center ? `&proximity=${center.lng.toFixed(4)},${center.lat.toFixed(4)}` : '';
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${TOKEN}&country=ng&limit=6${proximity}`,
      );
      const data = await res.json();
      const found = (data.features ?? []).map(
        (f: { text: string; place_name: string; center: [number, number] }) => ({
          name: f.text, placeName: f.place_name, lng: f.center[0], lat: f.center[1],
        }),
      );
      setHits(found);
      setNoHits(found.length === 0);
    } finally {
      setSearching(false);
    }
  }, [query]);

  function addHit(h: GeocodeHit) {
    // The admin's typed name is the town name (a hit may just be a street anchor
    // inside it, e.g. searching "Ikate" and picking "Kate Elegushi Road").
    const name = query.trim() || h.name;
    onChange([...locations, { name, centerLat: h.lat, centerLng: h.lng, radiusKm: 2 }]);
    setHits([]);
    setQuery('');
    setNoHits(false);
  }

  function updateLoc(i: number, patch: Partial<DraftLocation>) {
    const next = [...locations];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function removeLoc(i: number) {
    onChange(locations.filter((_, idx) => idx !== i));
  }

  if (!TOKEN) {
    return (
      <p className="rounded-xl bg-warn-bg px-4 py-3 text-sm text-warn">
        Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in .env.local to enable the coverage map.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* geocode search */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }}
              placeholder="Search a town (e.g. Oniru) and press enter"
              className="h-10 w-full rounded-full border border-line bg-white pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button type="button" onClick={() => void search()} disabled={searching}
            className="h-10 rounded-full bg-forest px-4 text-sm font-semibold text-white disabled:opacity-60">
            {searching ? '…' : 'Find'}
          </button>
          <button
            type="button"
            onClick={() => setDropMode((m) => !m)}
            title="Place a pin manually by clicking the map"
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors ${
              dropMode ? 'border-primary bg-mint-soft text-forest' : 'border-line bg-white text-body hover:bg-section'
            }`}
          >
            <Crosshair size={14} /> {dropMode ? 'Click map…' : 'Drop pin'}
          </button>
        </div>
        {noHits && !dropMode && (
          <p className="mt-1.5 text-xs text-warn">
            No match for &ldquo;{query}&rdquo; — Mapbox doesn&apos;t know every Nigerian locality by name. Use{' '}
            <button type="button" onClick={() => setDropMode(true)} className="font-semibold underline">Drop pin</button>{' '}
            to place it on the map yourself (your typed name will be used).
          </p>
        )}
        {dropMode && (
          <p className="mt-1.5 text-xs text-forest">
            Click the map where <strong>{query.trim() || 'the town'}</strong> is — a pin with a 2&nbsp;km radius will drop there.
          </p>
        )}
        {hits.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            {hits.map((h, i) => (
              <button key={i} type="button" onClick={() => addHit(h)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-section">
                <MapPin size={14} className="shrink-0 text-primary" />
                <span className="truncate">{h.placeName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* map */}
      <div
        ref={containerRef}
        style={{ height }}
        className={`w-full overflow-hidden rounded-2xl border ${dropMode ? 'cursor-crosshair border-primary ring-2 ring-primary/30' : 'border-line'}`}
      />

      {/* per-town rows */}
      {locations.length === 0 ? (
        <p className="text-xs text-faint">No towns yet — search above to drop the first pin. Drag pins to fine-tune; size each radius so circles overlap into one region.</p>
      ) : (
        <div className="space-y-2">
          {locations.map((l, i) => (
            <div key={l.id ?? `new-${i}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2">
              <input
                value={l.name}
                onChange={(e) => updateLoc(i, { name: e.target.value })}
                className="w-32 rounded-lg bg-section px-2.5 py-1.5 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {placed(l) ? (
                <>
                  <div className="flex flex-1 items-center gap-2 min-w-[10rem]">
                    <input
                      type="range" min={0.5} max={10} step={0.5} value={l.radiusKm}
                      onChange={(e) => updateLoc(i, { radiusKm: Number(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="w-14 text-right text-xs text-body">{l.radiusKm} km</span>
                  </div>
                  <span className="text-[11px] text-faint">{l.centerLat.toFixed(4)}, {l.centerLng.toFixed(4)}</span>
                </>
              ) : (
                <span className="flex-1 text-xs text-warn">Not on map — remove and re-add via search to place it.</span>
              )}
              <button type="button" onClick={() => removeLoc(i)} className="text-faint hover:text-danger" aria-label={`Remove ${l.name}`}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

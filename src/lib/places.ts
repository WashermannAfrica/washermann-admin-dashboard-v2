import { api } from './api';

// Address lookup via the backend's Google Places (New) proxy — used by the
// coverage-map geocoder. The browser never sees the Google key; the API holds
// it. Autocomplete returns predictions without coordinates; picking one resolves
// it to a latitude/longitude. A session token groups each typing+pick into one
// billable Places session.
//
// NOTE: the coverage map's tiles/markers are still rendered by Mapbox GL, which
// needs NEXT_PUBLIC_MAPBOX_TOKEN. Only the place *search* uses this proxy.

export interface PlaceSuggestion {
  placeId: string;
  /** Short place name, e.g. "Ikate". */
  name: string;
  /** Full address line, e.g. "Ikate, Lekki, Lagos, Nigeria". */
  placeName: string;
}

export interface PlaceLocation extends PlaceSuggestion {
  latitude: number;
  longitude: number;
}

export interface AutocompleteOptions {
  sessionToken?: string;
  /** Bias results toward a point (the current map centre) for relevant hits. */
  proximity?: { latitude: number; longitude: number };
  signal?: AbortSignal;
}

/** A fresh Places session token (one per "start typing → pick" cycle). */
export function newSessionToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function placeAutocomplete(
  query: string,
  opts: AutocompleteOptions = {},
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params: Record<string, string> = { q };
  if (opts.sessionToken) params.sessionToken = opts.sessionToken;
  if (opts.proximity) {
    params.lat = opts.proximity.latitude.toFixed(5);
    params.lng = opts.proximity.longitude.toFixed(5);
  }

  const res = await api.get<{ data: PlaceSuggestion[] }>('/places/autocomplete', {
    params,
    signal: opts.signal,
  });
  return res.data?.data ?? [];
}

export async function placeDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceLocation> {
  const params: Record<string, string> = { placeId };
  if (sessionToken) params.sessionToken = sessionToken;

  const res = await api.get<{ data: PlaceLocation }>('/places/details', { params });
  const d = res.data?.data;
  if (!d) throw new Error('Could not load that address. Please try again.');
  return d;
}

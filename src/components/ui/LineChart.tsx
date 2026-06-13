'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
  fill?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Smooth SVG line chart matching the design's green area charts:
    light horizontal gridlines, month labels, optional legend & range pill. */
export function LineChart({
  series,
  labels = MONTHS,
  height = 220,
  yTicks = 4,
  legend = false,
  rangeLabel,
}: {
  series: ChartSeries[];
  labels?: string[];
  height?: number;
  yTicks?: number;
  legend?: boolean;
  rangeLabel?: string;
}) {
  const uid = useId().replace(/[:]/g, '');
  const W = 720, H = height, padL = 40, padR = 12, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all) * 1.15 || 1;
  const min = 0;
  const n = Math.max(...series.map((s) => s.data.length));

  const X = (i: number) => padL + (plotW * i) / Math.max(1, n - 1);
  const Y = (v: number) => padT + plotH * (1 - (v - min) / (max - min));

  function smoothPath(data: number[]): string {
    if (data.length === 0) return '';
    let d = `M ${X(0)} ${Y(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = X(i - 1), y0 = Y(data[i - 1]), x1 = X(i), y1 = Y(data[i]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }

  return (
    <div>
      {(legend || rangeLabel) && (
        <div className="mb-2 flex items-center justify-end gap-4">
          {legend && series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-body">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
          {rangeLabel && (
            <button className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-xs text-body">
              {rangeLabel} <ChevronDown size={13} className="text-faint" />
            </button>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {Array.from({ length: yTicks + 1 }, (_, g) => {
          const v = min + ((max - min) * g) / yTicks;
          return (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={Y(v)} y2={Y(v)} stroke="#F0F0F0" strokeWidth="1" />
              <text x={padL - 8} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="#A0A4A8">
                {Math.round(v).toLocaleString()}
              </text>
            </g>
          );
        })}
        {labels.slice(0, n).map((l, i) => (
          <text key={l + i} x={X(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#A0A4A8">{l}</text>
        ))}
        {series.map((s, si) => (
          <g key={s.name}>
            {s.fill && (
              <>
                <defs>
                  <linearGradient id={`g${uid}${si}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${smoothPath(s.data)} L ${X(s.data.length - 1)} ${Y(0)} L ${X(0)} ${Y(0)} Z`} fill={`url(#g${uid}${si})`} />
              </>
            )}
            <path d={smoothPath(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    </div>
  );
}

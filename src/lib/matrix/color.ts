import { clamp01 } from './math'

export type Rgb = readonly [number, number, number]

/** Parses #rgb or #rrggbb, allowing the whitespace CSS custom properties keep. */
export function parseHex(value: string): Rgb {
  const hex = value.trim().replace(/^#/, '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Not a hex color: "${value}"`)
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = clamp01(t)
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ]
}

/** Weight at which a cell reaches the accent color. */
export const RAMP_SPLIT = 0.6

/** Cell color for a weight: line → accent up to RAMP_SPLIT, then accent → accent-2. */
export function rampColor(w: number, line: Rgb, accent: Rgb, accent2: Rgb): Rgb {
  const t = clamp01(w)
  return t < RAMP_SPLIT
    ? mix(line, accent, t / RAMP_SPLIT)
    : mix(accent, accent2, (t - RAMP_SPLIT) / (1 - RAMP_SPLIT))
}

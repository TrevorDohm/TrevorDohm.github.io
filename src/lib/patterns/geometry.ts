import { RAMP_SPLIT } from '../matrix/color'
import { clamp01 } from '../matrix/math'

/** Padding, in px at the 424 reference size. */
const PAD = 10
const REF = 424
const GAP = 0.16
const RADIUS = 5

/** Square for cell (row i, column j) in a size x size map of n x n cells. */
export function cellRect(i: number, j: number, n: number, size: number) {
  const scale = size / REF
  const pad = PAD * scale
  const pitch = (size - 2 * pad) / n
  const inset = pitch * (GAP / 2)
  return {
    x: pad + j * pitch + inset,
    y: pad + i * pitch + inset,
    w: pitch * (1 - GAP),
    r: RADIUS * scale,
  }
}

/** CSS mirror of rampColor: the same token pairs and split, as a color-mix() string. */
export function rampMix(w: number): string {
  const t = clamp01(w)
  const lower = t < RAMP_SPLIT
  const pct = Math.round((lower ? t / RAMP_SPLIT : (t - RAMP_SPLIT) / (1 - RAMP_SPLIT)) * 100)
  return lower
    ? `color-mix(in srgb, var(--color-accent) ${pct}%, var(--color-line))`
    : `color-mix(in srgb, var(--color-accent-2) ${pct}%, var(--color-accent))`
}

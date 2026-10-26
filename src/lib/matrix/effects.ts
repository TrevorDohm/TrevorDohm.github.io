import type { Grid } from './geometry'
import { clamp01 } from './math'
import type { Ripple } from './state'

/**
 * The click or tap "drop", in cells and seconds: the clicked cell flashes to
 * `peak`, a soft ring of `width` travels out and slows to a stop at `spread`,
 * and everything is gone after `lifetime`. Nothing reaches `reach` cells.
 */
export const DROP = { peak: 0.7, reach: 4, spread: 3, width: 0.6, lifetime: 0.7 } as const

/** Brightness a drop adds `distance` cells from the click, `age` seconds after it. */
export function dropAt(distance: number, age: number): number {
  const { peak, reach, spread, width, lifetime } = DROP
  if (age < 0 || age >= lifetime || distance >= reach) return 0
  const life = 1 - age / lifetime // 1 at the click, 0 at the end
  const radius = spread * (1 - life * life) // fast at first, easing to a stop
  const ring = Math.exp(-(((distance - radius) / width) ** 2) / 2)
  const flash = Math.exp(-((distance / width) ** 2) / 2) * life ** 3
  const falloff = 1 - (distance / reach) ** 2
  return peak * falloff * life * Math.max(ring, flash)
}

/** A slow looping path inside the rectangle at (x, y) of size width x height. `t` is in seconds. */
export function idlePoint(
  t: number,
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number] {
  return [
    x + width / 2 + width * 0.38 * Math.sin(t * 0.31),
    y + height / 2 + height * 0.38 * Math.sin(t * 0.23 + Math.PI / 2),
  ]
}

/** Visibility of a cell during the load-in wave, which sweeps from the top-left corner. */
export function introAlpha(
  progress: number,
  row: number,
  col: number,
  rows: number,
  cols: number,
): number {
  const span = rows + cols - 2
  const start = span > 0 ? ((row + col) / span) * 0.7 : 0
  return clamp01((progress - start) / 0.3)
}

/**
 * Fills `boost` with the extra brightness of the active drops, capped at the
 * drop's peak so rapid clicks on one spot don't add up. Only cells within
 * `DROP.reach` of a click are visited.
 */
export function applyBoost(
  boost: Float32Array,
  grid: Grid,
  ripples: readonly Ripple[],
  now: number,
): Float32Array {
  const { cols, rows, pitch, originX, originY, centers } = grid
  boost.fill(0)
  for (const ripple of ripples) {
    const age = (now - ripple.start) / 1000
    const col = (ripple.x - originX) / pitch
    const row = (ripple.y - originY) / pitch
    const c0 = Math.max(0, Math.floor(col - DROP.reach))
    const c1 = Math.min(cols - 1, Math.ceil(col + DROP.reach))
    const r0 = Math.max(0, Math.floor(row - DROP.reach))
    const r1 = Math.min(rows - 1, Math.ceil(row + DROP.reach))
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c
        const d = Math.hypot(centers[i * 2] - ripple.x, centers[i * 2 + 1] - ripple.y) / pitch
        boost[i] = Math.min(DROP.peak, boost[i] + dropAt(d, age))
      }
    }
  }
  return boost
}

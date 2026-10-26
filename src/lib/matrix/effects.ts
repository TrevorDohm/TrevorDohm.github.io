import type { Grid } from './geometry'
import { clamp01 } from './math'
import type { Ripple } from './state'

/** Ripple shape: speed in cells per second, ring width in cells, lifetime in seconds. */
export const RIPPLE = { speed: 14, width: 0.9, lifetime: 1.4 } as const

/**
 * Brightness a ripple adds at `distance` from its origin, `age` seconds after
 * it started: a Gaussian ring expanding at `speed` that fades out linearly.
 */
export function rippleAt(
  distance: number,
  age: number,
  speed: number,
  width: number,
  lifetime: number,
): number {
  if (age < 0 || age >= lifetime) return 0
  const offset = distance - age * speed
  return Math.exp(-(offset * offset) / (2 * width * width)) * (1 - age / lifetime)
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

/** Fills `boost` with extra brightness from the hovered row and column and active ripples. */
export function applyBoost(
  boost: Float32Array,
  grid: Grid,
  hover: number,
  ripples: readonly Ripple[],
  now: number,
  axisBoost: number,
): Float32Array {
  const { cols, rows, pitch, centers } = grid
  boost.fill(0)

  if (hover >= 0) {
    const row = Math.floor(hover / cols)
    const col = hover % cols
    for (let c = 0; c < cols; c++) boost[row * cols + c] += axisBoost
    for (let r = 0; r < rows; r++) boost[r * cols + col] += axisBoost
    boost[hover] -= axisBoost // counted by both the row and the column
  }

  for (const ripple of ripples) {
    const age = (now - ripple.start) / 1000
    for (let i = 0; i < cols * rows; i++) {
      const d = Math.hypot(centers[i * 2] - ripple.x, centers[i * 2 + 1] - ripple.y) / pitch
      boost[i] += rippleAt(d, age, RIPPLE.speed, RIPPLE.width, RIPPLE.lifetime)
    }
  }
  return boost
}

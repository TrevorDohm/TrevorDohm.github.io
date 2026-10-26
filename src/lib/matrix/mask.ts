import type { Grid } from './geometry'

/** A box in the canvas's CSS pixels. */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

/** Highest weight a cell under the hero copy may be drawn at. Such cells get no glow. */
export const COPY_CAP = 0.35

/**
 * 1 for each grid cell whose square overlaps one of `rects` (touching an edge
 * doesn't count), else 0. Cells listed in `exempt` (grid indices; -1 is
 * ignored) stay 0, so the name is never capped.
 */
export function copyMask(grid: Grid, rects: readonly Rect[], exempt: Int32Array): Uint8Array {
  const { cols, rows, pitch, originX, originY } = grid
  const mask = new Uint8Array(cols * rows)
  for (const r of rects) {
    if (r.right <= r.left || r.bottom <= r.top) continue
    const c0 = Math.max(0, Math.floor((r.left - originX) / pitch))
    const c1 = Math.min(cols - 1, Math.ceil((r.right - originX) / pitch) - 1)
    const r0 = Math.max(0, Math.floor((r.top - originY) / pitch))
    const r1 = Math.min(rows - 1, Math.ceil((r.bottom - originY) / pitch) - 1)
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) mask[row * cols + col] = 1
    }
  }
  for (const i of exempt) if (i >= 0) mask[i] = 0
  return mask
}

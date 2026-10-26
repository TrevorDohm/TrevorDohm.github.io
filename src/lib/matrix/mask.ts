import type { Grid } from './geometry'

/** A box in the canvas's CSS pixels. */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

/** Mask values: a cell under the copy (drawn at rest), and a cell beside one (capped, no glow). */
export const MASKED = 1
export const EDGE = 2
/** Highest weight an EDGE cell is drawn at: halfway between rest (0) and full (1). */
export const EDGE_CAP = 0.5

/**
 * MASKED for each grid cell whose square overlaps one of `rects` (touching an
 * edge doesn't count), EDGE for the cells around those (one cell, diagonals
 * included), else 0. Cells listed in `exempt` (grid indices; -1 is ignored)
 * stay 0, so the name is never held back.
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
      for (let col = c0; col <= c1; col++) mask[row * cols + col] = MASKED
    }
  }
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== MASKED) continue
    const row = Math.floor(i / cols)
    const col = i % cols
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
        if (mask[r * cols + c] === 0) mask[r * cols + c] = EDGE
      }
    }
  }
  for (const i of exempt) if (i >= 0) mask[i] = 0
  return mask
}

/**
 * Text line boxes from a Range's client rects: drops empty fragments and
 * merges fragments whose vertical spans overlap (one line, several spans).
 */
export function lineRects(fragments: readonly Rect[]): Rect[] {
  const lines: Rect[] = []
  for (const f of fragments) {
    if (f.right <= f.left || f.bottom <= f.top) continue
    const line = lines.find((l) => f.top < l.bottom && f.bottom > l.top)
    if (!line) {
      lines.push({ ...f })
      continue
    }
    line.left = Math.min(line.left, f.left)
    line.right = Math.max(line.right, f.right)
    line.top = Math.min(line.top, f.top)
    line.bottom = Math.max(line.bottom, f.bottom)
  }
  return lines
}

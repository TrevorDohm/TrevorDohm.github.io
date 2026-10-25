import { cellRect } from './geometry'

/**
 * The static map draws each cell as a square stroked with round joins, in a
 * grid where one cell pitch is one unit: side + stroke is the cell's width, and
 * half the stroke is its corner radius. All numbers come from cellRect.
 */
export function frameGeometry(n: number, size: number) {
  const first = cellRect(0, 0, n, size)
  const pitch = cellRect(0, 1, n, size).x - first.x
  const stroke = (2 * first.r) / pitch
  return {
    /** Where cell (0, 0)'s inner square starts, in px. */
    offset: first.x + first.r,
    scale: pitch,
    side: first.w / pitch - stroke,
    stroke,
  }
}

/** Short number text: 3 decimals, no trailing zeros, no leading zero. */
export function num(v: number): string {
  return String(Number(v.toFixed(3))).replace(/^(-?)0\./, '$1.')
}

/**
 * One path per level (index = level, '' when no cell has it). Each cell is a
 * subpath at its grid point; after the first, moves are relative to the
 * previous cell, since `z` returns to the subpath start.
 */
export function levelPaths(weights: Float32Array, n: number, levels: number, side: number): string[] {
  const s = num(side)
  const square = `h${s}v${s}h-${s}z`
  const paths = Array.from({ length: levels }, () => '')
  const last: ([number, number] | null)[] = Array.from({ length: levels }, () => null)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const level = Math.round(Math.min(1, Math.max(0, weights[i * n + j])) * (levels - 1))
      const prev = last[level]
      paths[level] += (prev ? `m${j - prev[1]} ${i - prev[0]}` : `M${j} ${i}`) + square
      last[level] = [i, j]
    }
  }
  return paths
}

/**
 * Grid layout for the attention matrix. Pure: every value is in CSS pixels.
 */
export interface Grid {
  /** Cells per side. */
  n: number
  /** Distance between neighboring cell centers. */
  pitch: number
  /** Drawn size of one cell. */
  cell: number
  originX: number
  originY: number
  /** Cell centers as [x0, y0, x1, y1, ...], row-major. */
  centers: Float32Array
}

export const MOBILE_BREAKPOINT = 768
/** Share of the pitch a cell covers; the rest is the gap between cells. */
export const CELL_FILL = 0.78

export function cellsPerSide(width: number): number {
  return width < MOBILE_BREAKPOINT ? 14 : 24
}

export function layoutGrid(width: number, height: number): Grid {
  const n = cellsPerSide(width)
  const mobile = width < MOBILE_BREAKPOINT
  // Desktop keeps the left side clear for the hero text.
  const side = mobile ? width * 0.92 : Math.min(height * 0.85, width * 0.55)
  const pitch = side / n
  const originX = mobile ? (width - side) / 2 : width - side - width * 0.04
  const originY = (height - side) / 2

  const centers = new Float32Array(n * n * 2)
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = (row * n + col) * 2
      centers[i] = originX + (col + 0.5) * pitch
      centers[i + 1] = originY + (row + 0.5) * pitch
    }
  }

  return { n, pitch, cell: pitch * CELL_FILL, originX, originY, centers }
}

/** Index of the cell under (x, y), or -1 when the point is outside the grid. */
export function cellAt(grid: Grid, x: number, y: number): number {
  const col = Math.floor((x - grid.originX) / grid.pitch)
  const row = Math.floor((y - grid.originY) / grid.pitch)
  if (col < 0 || row < 0 || col >= grid.n || row >= grid.n) return -1
  return row * grid.n + col
}

/**
 * Grid layout for the attention matrix. Pure: every value is in CSS pixels.
 */
export interface Grid {
  cols: number
  rows: number
  /** Distance between neighboring cell centers. */
  pitch: number
  /** Drawn size of one cell. */
  cell: number
  originX: number
  originY: number
  /** Cell centers as [x0, y0, x1, y1, ...], row-major. */
  centers: Float32Array
}

/** Share of the pitch a cell covers; the rest is the gap between cells. */
export const CELL_FILL = 0.78

/**
 * A grid covering [0, width] x [0, height] edge to edge, with a cell boundary
 * at (anchorX, anchorY). The origin is the last lattice line at or before 0.
 */
export function layoutGrid(
  width: number,
  height: number,
  pitch: number,
  anchorX: number,
  anchorY: number,
): Grid {
  const originX = anchorX - Math.ceil(anchorX / pitch - 1e-9) * pitch
  const originY = anchorY - Math.ceil(anchorY / pitch - 1e-9) * pitch
  const cols = Math.ceil((width - originX) / pitch - 1e-9)
  const rows = Math.ceil((height - originY) / pitch - 1e-9)

  const centers = new Float32Array(cols * rows * 2)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 2
      centers[i] = originX + (col + 0.5) * pitch
      centers[i + 1] = originY + (row + 0.5) * pitch
    }
  }

  return { cols, rows, pitch, cell: pitch * CELL_FILL, originX, originY, centers }
}

/** Index of the cell under (x, y), or -1 when the point is outside the grid. */
export function cellAt(grid: Grid, x: number, y: number): number {
  const col = Math.floor((x - grid.originX) / grid.pitch)
  const row = Math.floor((y - grid.originY) / grid.pitch)
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return -1
  return row * grid.cols + col
}

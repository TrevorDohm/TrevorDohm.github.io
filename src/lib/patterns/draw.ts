import { rampColor } from '../matrix/color'
import type { Palette } from '../matrix/renderer'
import { cellRect } from './geometry'

/** Clears the canvas and draws an n x n map of rounded cells, colored on the hero's ramp. */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  weights: Float32Array,
  n: number,
  size: number,
  palette: Palette,
): void {
  ctx.clearRect(0, 0, size, size)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const { x, y, w, r } = cellRect(i, j, n, size)
      const [red, green, blue] = rampColor(
        Math.min(1, weights[i * n + j]),
        palette.line,
        palette.accent,
        palette.accent2,
      )
      ctx.fillStyle = `rgb(${red},${green},${blue})`
      ctx.beginPath()
      ctx.roundRect(x, y, w, w, r)
      ctx.fill()
    }
  }
}

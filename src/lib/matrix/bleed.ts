/**
 * The bleed: rows of the grid above the hero's top edge. Pure. On iOS the top
 * rubber band pulls the page down and shows what sits above the document, so
 * the canvas starts above the hero and these rows continue the lattice there.
 * Everything else stays in hero coordinates (y = 0 at the hero's top); only
 * the renderer shifts by the bleed. The rows rest like the hero's top rows:
 * attention only, no name, no drops, no fade.
 */
import { introAlpha } from './effects'
import type { Grid } from './geometry'
import { GLOW_PEAK, WAVE_SECONDS, WAVE_START } from './intro'

/**
 * The rows above `hero` that reach `top` px above the hero's top edge: same
 * columns and pitch, ending where the hero grid's first row starts.
 */
export function bleedGrid(hero: Grid, top: number): Grid {
  const { cols, pitch, originX } = hero
  const rows = Math.max(0, Math.ceil((top + hero.originY) / pitch - 1e-9))
  const originY = hero.originY - rows * pitch
  const centers = new Float32Array(cols * rows * 2)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 2
      centers[i] = originX + (col + 0.5) * pitch
      centers[i + 1] = originY + (row + 0.5) * pitch
    }
  }
  return { ...hero, rows, originY, centers }
}

/**
 * Target weights for the bleed rows at intro clock `t`: the glow peak times
 * the attention, sweeping in with the hero's top row of each column (the
 * load-in wave runs from the top-left over a grid of `heroRows` rows).
 */
export function bleedTargets(out: Float32Array, attention: Float32Array, bleed: Grid, heroRows: number, t: number): Float32Array {
  const wave = (t - WAVE_START) / WAVE_SECONDS
  for (let i = 0; i < bleed.cols * bleed.rows; i++) {
    const a = wave >= 1 ? 1 : introAlpha(wave, 0, i % bleed.cols, heroRows, bleed.cols)
    out[i] = GLOW_PEAK * attention[i] * a
  }
  return out
}

/**
 * Whether to draw the bleed this frame. It only shows during the top
 * overscroll, when iOS reports a negative scrollY; a still frame (reduced
 * motion) is drawn once, so it always includes it.
 */
export function showBleed(scrollY: number, still: boolean): boolean {
  return still || scrollY < 0
}

/** How far (px) the canvas starts above the hero, from their viewport tops. */
export function bleedOffset(heroTop: number, canvasTop: number): number {
  return Math.max(0, heroTop - canvasTop)
}

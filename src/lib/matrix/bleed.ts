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

/** Below this a bleed weight is drawn as a resting cell (under half a colour-ramp step). */
export const REST = 0.005

/** A vertical extent in viewport px. */
export interface Span {
  top: number
  bottom: number
}

/**
 * How far (px) the canvas reaches above the hero, measured, or null when the
 * canvas doesn't cover the hero (stale or unsupported CSS collapsed or moved
 * it): then the matrix isn't drawn and the static name stays. Half a pixel
 * of slack either way for rounding.
 */
export function measuredBleed(hero: Span, canvas: Span): number | null {
  if (canvas.bottom - canvas.top <= 0) return null
  if (canvas.top > hero.top + 0.5 || canvas.bottom < hero.bottom - 0.5) return null
  return hero.top - canvas.top
}

/**
 * The rows above `hero` that reach `top` px above its top edge: same columns
 * and pitch, ending where the hero grid's first row starts.
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
 * The rows [first, last) of `bleed` the light at height `qy` can lift to REST
 * or more: GLOW_PEAK * exp(-d / temperature) >= REST needs d, at least the
 * vertical distance in cells, under temperature * ln(GLOW_PEAK / REST). Every
 * other row rests, so its attention needn't be computed. Empty: first = last.
 */
export function litRows(bleed: Grid, qy: number, temperature: number): [number, number] {
  const reach = temperature * Math.log(GLOW_PEAK / REST) * bleed.pitch
  const row = (y: number) => (y - bleed.originY) / bleed.pitch - 0.5 // fractional row of a centre at y
  const first = Math.max(0, Math.ceil(row(qy - reach)))
  const last = Math.min(bleed.rows, Math.floor(row(qy + reach)) + 1)
  return first < last ? [first, last] : [0, 0]
}

/**
 * Target weights for the bleed at intro clock `t`: on rows [first, last), the
 * glow peak times the attention, sweeping in with the hero's top row of each
 * column (the load-in wave runs from the top-left over `heroRows` rows);
 * 0 elsewhere.
 */
export function bleedTargets(
  out: Float32Array,
  attention: Float32Array,
  bleed: Grid,
  heroRows: number,
  t: number,
  [first, last]: readonly [number, number],
): Float32Array {
  const { cols } = bleed
  const wave = (t - WAVE_START) / WAVE_SECONDS
  out.fill(0)
  for (let i = first * cols; i < last * cols; i++) {
    const a = wave >= 1 ? 1 : introAlpha(wave, 0, i % cols, heroRows, cols)
    out[i] = GLOW_PEAK * attention[i] * a
  }
  return out
}

/** Sets weights under REST to exactly 0, so resting cells share one style (and one fill). */
export function settleRest(weights: Float32Array): Float32Array {
  for (let i = 0; i < weights.length; i++) if (weights[i] < REST) weights[i] = 0
  return weights
}

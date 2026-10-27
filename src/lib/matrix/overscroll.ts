import { attentionWeights, easeToward } from './attention'
import { bleedGrid, bleedTargets, litRows, settleRest } from './bleed'
import type { Grid } from './geometry'
import type { Frame, Layer } from './renderer'

export interface BleedLayer {
  /** Lays out the rows above `hero`, reaching `top` px above its top edge. */
  layout(hero: Grid, top: number): void
  /**
   * This frame's bleed layer, or null without rows. Drawn every frame (it is
   * off screen except during the top overscroll, which iOS may not report).
   * Only rows the light can reach get attention; the rest settle to exactly
   * 0, so the renderer fills them as one path. A `still` frame (reduced
   * motion) is all resting cells.
   */
  layer(q: readonly [number, number] | null, clock: number, still: boolean, dt: number): Layer | null
}

/** The hero grid's continuation above the hero (see bleed.ts), lit by the same light. */
export function createBleedLayer(temperature: number, easeRate: number): BleedLayer {
  let grid: Grid | null = null
  let heroRows = 0
  let attention = new Float32Array(0)
  let target = new Float32Array(0)
  let frame: Frame | null = null

  return {
    layout(hero, top) {
      grid = bleedGrid(hero, top)
      heroRows = hero.rows
      const count = grid.cols * grid.rows
      attention = new Float32Array(count)
      target = new Float32Array(count)
      frame = { weights: new Float32Array(count), boost: new Float32Array(count), fade: new Float32Array(count).fill(1), copy: new Uint8Array(count) }
    },
    layer(q, clock, still, dt) {
      if (!grid || !frame || grid.rows === 0) return null
      const { cols, centers, pitch } = grid
      const lit = q && !still ? litRows(grid, q[1], temperature) : ([0, 0] as const)
      if (q && lit[0] < lit[1]) {
        const [a, b] = [lit[0] * cols, lit[1] * cols]
        attentionWeights(centers.subarray(a * 2, b * 2), pitch, q[0], q[1], temperature, attention.subarray(a, b))
      }
      bleedTargets(target, attention, grid, heroRows, clock, lit)
      if (dt > 0) easeToward(frame.weights, target, easeRate, dt)
      else frame.weights.set(target) // a layout or a still frame: start on the targets
      settleRest(frame.weights)
      return { grid, frame }
    },
  }
}

import { attentionWeights, easeToward } from './attention'
import { bleedGrid, bleedTargets, showBleed } from './bleed'
import type { Grid } from './geometry'
import type { Layer } from './renderer'

export interface BleedLayer {
  /** Lays out the rows above `hero`, reaching `top` px above its top edge. */
  layout(hero: Grid, top: number): void
  /** True while the page is pulled down past its top (iOS rubber band). */
  overscrolled(): boolean
  /**
   * This frame's bleed layer, or null when it isn't shown: only during the
   * top overscroll, or always for a `still` frame (reduced motion: resting
   * cells, no glow). Weights ease like the hero's; they snap to their targets
   * when the layer reappears.
   */
  layer(q: readonly [number, number] | null, clock: number, still: boolean, dt: number): Layer | null
}

/** The hero grid's continuation above the hero (see bleed.ts), lit by the same light. */
export function createBleedLayer(temperature: number, easeRate: number): BleedLayer {
  let grid: Grid | null = null
  let heroRows = 0
  let attention = new Float32Array(0)
  let target = new Float32Array(0)
  let layer: Layer | null = null
  let shown = false

  return {
    layout(hero, top) {
      const next = bleedGrid(hero, top)
      const count = next.cols * next.rows
      grid = next
      heroRows = hero.rows
      attention = new Float32Array(count)
      target = new Float32Array(count)
      const frame = { weights: new Float32Array(count), boost: new Float32Array(count), fade: new Float32Array(count).fill(1), copy: new Uint8Array(count) }
      layer = { grid: next, frame }
      shown = false
    },
    overscrolled: () => showBleed(window.scrollY, false),
    layer(q, clock, still, dt) {
      const show = !!grid && grid.rows > 0 && !!q && showBleed(window.scrollY, still)
      if (!show || !grid || !q || !layer) return (shown = false), null
      attentionWeights(grid.centers, grid.pitch, q[0], q[1], temperature, attention)
      if (still) attention.fill(0)
      bleedTargets(target, attention, grid, heroRows, clock)
      if (shown) easeToward(layer.frame.weights, target, easeRate, dt)
      else layer.frame.weights.set(target)
      shown = true
      return layer
    },
  }
}

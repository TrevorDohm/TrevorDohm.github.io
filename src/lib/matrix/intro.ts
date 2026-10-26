/**
 * The name intro on the hero grid. Pure: maps the name block onto a grid and
 * composes per-cell target weights for a moment in the timeline.
 */
import { introAlpha } from './effects'
import type { Grid } from './geometry'
import { clamp01 } from './math'
import { bottomFade, LINE_GAP, NAME_LINES, nameMask, nameWeight, TIMELINE } from './name'

export const NAME = nameMask(NAME_LINES, LINE_GAP)

/** Seconds the background attention takes to sweep in. */
const WAVE_SECONDS = 1.2
/** When the background attention starts sweeping in. */
export const WAVE_START = TIMELINE.form + 0.6 * TIMELINE.hold
/** When the name starts to break up and the query leaves its centre. */
export const BREAK_AT = TIMELINE.form + TIMELINE.hold
/** When the name has fully broken up and the query is on its idle path. */
export const INTRO_END = TIMELINE.form + TIMELINE.hold + TIMELINE.break
/** A moment in the hold: the name is fully lit and nothing else is. */
export const STILL_AT = TIMELINE.form + TIMELINE.hold / 2

/**
 * Where the intro clock starts. If the page has already painted, the visitor
 * has seen the static name lit, so the canvas takes over in the hold (every
 * name cell is fully on at `form`) instead of sweeping in from dark.
 */
export function introStart(painted: boolean): number {
  return painted ? TIMELINE.form : 0
}

/**
 * Grid index of each name cell (in `NAME.cells` order) when the name block's
 * top-left corner sits at (anchorX, anchorY), or -1 where it falls off the grid.
 */
export function nameCells(grid: Grid, anchorX: number, anchorY: number): Int32Array {
  const col0 = Math.round((anchorX - grid.originX) / grid.pitch)
  const row0 = Math.round((anchorY - grid.originY) / grid.pitch)
  return Int32Array.from(NAME.cells, ([r, c]) => {
    const row = row0 + r
    const col = col0 + c
    const inside = row >= 0 && col >= 0 && row < grid.rows && col < grid.cols
    return inside ? row * grid.cols + col : -1
  })
}

/** Bottom dissolve visibility for every cell of the grid. */
export function fadeMap(grid: Grid): Float32Array {
  const fade = new Float32Array(grid.cols * grid.rows)
  for (let i = 0; i < fade.length; i++) {
    fade[i] = bottomFade(Math.floor(i / grid.cols), grid.rows, i % grid.cols)
  }
  return fade
}

/** Query point at time t: on the name's centre, easing onto the idle path over the break. */
export function introQuery(
  t: number,
  centre: readonly [number, number],
  idle: readonly [number, number],
): [number, number] {
  const k = clamp01((t - BREAK_AT) / TIMELINE.break)
  return [centre[0] + (idle[0] - centre[0]) * k, centre[1] + (idle[1] - centre[1]) * k]
}

/**
 * Target weights at time t. Attention reaches each cell with the load-in wave,
 * which starts after the name has formed; name cells follow `nameWeight` on
 * top of that attention.
 */
export function composeTargets(
  target: Float32Array,
  attention: Float32Array,
  grid: Grid,
  cells: Int32Array,
  t: number,
): Float32Array {
  const { cols, rows } = grid
  const wave = (t - WAVE_START) / WAVE_SECONDS
  for (let i = 0; i < cols * rows; i++) {
    const a = wave >= 1 ? 1 : introAlpha(wave, Math.floor(i / cols), i % cols, rows, cols)
    target[i] = attention[i] * a
  }
  cells.forEach((i, k) => {
    if (i < 0) return
    const [row, col] = NAME.cells[k]
    target[i] = nameWeight(t, col, row, NAME.cols, target[i])
  })
  return target
}

/**
 * After a re-layout: resets the old name cells to their target, then writes the
 * saved name weights into the new ones (NaN = nothing saved, keep the target).
 * Pass no old cells when `weights` is new.
 */
export function moveName(
  weights: Float32Array,
  oldCells: Int32Array,
  newCells: Int32Array,
  saved: Float32Array,
  target: Float32Array,
): void {
  for (const i of oldCells) if (i >= 0) weights[i] = target[i]
  newCells.forEach((i, k) => {
    if (i >= 0 && k < saved.length && !Number.isNaN(saved[k])) weights[i] = saved[k]
  })
}

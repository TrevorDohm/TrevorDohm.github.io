/**
 * The hero grid and its per-cell arrays, built from a measured layout. Pure.
 */
import { fadeRows, type FadeRows } from './dissolve'
import { layoutGrid, type Grid } from './geometry'
import { fadeMap, moveName, NAME, nameCells } from './intro'
import { copyMask } from './mask'
import type { Layout } from './measure'

export interface Scene {
  grid: Grid
  width: number
  height: number
  /** Grid index of each name cell, -1 off the grid; empty without a name. */
  cells: Int32Array
  /** The name's centre, where the intro's light starts. */
  centre: [number, number]
  /** Where the fades are; the idle path stays between them. */
  at: FadeRows
  weights: Float32Array
  attention: Float32Array
  target: Float32Array
  boost: Float32Array
  fade: Float32Array
  copy: Uint8Array
}

/**
 * The scene for layout `m`. A grid of the same shape as `prev` keeps its
 * arrays (and every cell's index); any change starts fresh.
 */
export function layoutScene(m: Layout, prev: Scene | null): Scene {
  const { width, height, pitch, ax, ay, named } = m
  const grid = layoutGrid(width, height, pitch, ax, ay)
  const cells = named ? nameCells(grid, ax, ay) : new Int32Array(0)
  const centre: [number, number] = named
    ? [ax + (pitch * NAME.cols) / 2, ay + (pitch * NAME.rows) / 2]
    : [width / 2, height / 2]
  const count = grid.cols * grid.rows
  const same = prev && prev.grid.cols === grid.cols && prev.grid.rows === grid.rows
  const arrays = same
    ? prev
    : { weights: new Float32Array(count), attention: new Float32Array(count), target: new Float32Array(count), boost: new Float32Array(count) }
  const at = fadeRows(grid, m.buttonBottom, named ? ay : null)
  return {
    grid,
    width,
    height,
    cells,
    centre,
    at,
    weights: arrays.weights,
    attention: arrays.attention,
    target: arrays.target,
    boost: arrays.boost,
    fade: fadeMap(grid, cells, at),
    copy: copyMask(grid, m.copy, cells),
  }
}

/**
 * After a re-layout, once `scene.target` is composed: new arrays (or a still
 * frame) start from the targets, and either way the name keeps its eased
 * state, moved from `prev`'s name cells to the new ones.
 */
export function carryName(scene: Scene, prev: Scene | null, still: boolean): void {
  const fresh = !prev || prev.weights !== scene.weights
  const saved = prev ? Float32Array.from(prev.cells, (i) => (i >= 0 ? prev.weights[i] : NaN)) : new Float32Array(0)
  if (fresh || still) scene.weights.set(scene.target)
  moveName(scene.weights, fresh || !prev ? new Int32Array(0) : prev.cells, scene.cells, saved, scene.target)
}

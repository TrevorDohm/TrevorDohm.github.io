import { prefersReducedMotion } from '../motion/prefers-reduced-motion'
import { attentionWeights, easeToward } from './attention'
import { applyBoost, DROP } from './effects'
import { layoutGrid, type Grid } from './geometry'
import { bindInput } from './input'
import * as intro from './intro'
import { createLoop } from './loop'
import { copyMask } from './mask'
import { measure } from './measure'
import { goalAt, isSettled, smoothQuery } from './query'
import { readPalette } from './palette'
import { createRenderer, type Renderer } from './renderer'
import { createState, isIdle, pruneRipples } from './state'

/** Softmax temperature in cells. Higher spreads the glow wider (the mockup's 2.2). */
const TEMPERATURE = 2.2
/** How quickly each cell settles on its target, per second (the mockup's 0.18 a frame). */
const EASE_RATE = 12

/**
 * Mounts the attention matrix on the canvas inside `root`. The grid is laid out
 * from the static name (`[data-name-anchor]`) so the live name lands on it, and
 * the glow is kept off the copy (`[data-matrix-copy]`). Returns cleanup.
 */
export function init(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-matrix-canvas]')
  if (!canvas) return () => {}
  const anchor = root.querySelector<SVGElement>('[data-name-anchor]')
  const copyEls = [...root.querySelectorAll('[data-matrix-copy]')]

  let renderer: Renderer
  try {
    renderer = createRenderer(canvas, readPalette(root))
  } catch {
    return () => {} // no canvas support or unreadable tokens: the static name stays
  }

  const reduced = prefersReducedMotion()
  const state = createState()
  let grid: Grid | null = null
  let cells: Int32Array = new Int32Array(0)
  let centre: [number, number] = [0, 0]
  let weights = new Float32Array(0)
  let attention = new Float32Array(0)
  let target = new Float32Array(0)
  let boost = new Float32Array(0)
  let fade: Float32Array = new Float32Array(0)
  let copy: Uint8Array = new Uint8Array(0)
  let layoutKey = ''
  let width = 0
  let height = 0
  // The light's centre. It glides toward the pointer or the idle path, never jumps.
  let query: [number, number] | null = null
  // Intro clock in seconds, from now. It always starts dark (the static name is
  // hidden until the canvas draws); reduced motion holds it on the lit name.
  let clock = reduced ? intro.STILL_AT : intro.INTRO_START

  const goal = (now: number) => goalAt(state, now, clock, centre, width, height)

  const updateTarget = (now: number, dt: number) => {
    if (!grid) return
    const [gx, gy] = goal(now)
    query = query ? smoothQuery(query, [gx, gy], dt) : [gx, gy]
    attentionWeights(grid.centers, grid.pitch, query[0], query[1], TEMPERATURE, attention)
    if (reduced) attention.fill(0) // still: only the name is lit
    intro.composeTargets(target, attention, grid, cells, clock)
  }

  const draw = () => {
    renderer.draw({ weights, boost, fade, copy })
    // The canvas now shows the name, so the static one can hide (it stays in flow).
    root.dataset.matrixReady = ''
    // The copy fades in as the name finishes forming (CSS, under data-js-intro).
    if (clock >= intro.COPY_AT) root.dataset.copyShown = ''
  }

  const resize = () => {
    const m = measure(canvas, anchor, copyEls)
    if (!m || m.key === layoutKey) return
    layoutKey = m.key
    width = m.width
    height = m.height
    const { pitch, ax, ay, named } = m

    const saved = Float32Array.from(cells, (i) => (i >= 0 ? weights[i] : NaN))
    const oldCells = cells
    const old = grid
    grid = layoutGrid(width, height, pitch, ax, ay)
    cells = named ? intro.nameCells(grid, ax, ay) : new Int32Array(0)
    centre = named
      ? [ax + (pitch * intro.NAME.cols) / 2, ay + (pitch * intro.NAME.rows) / 2]
      : [width / 2, height / 2]
    // Same shape keeps the arrays (and every cell's index); any change starts fresh.
    const fresh = !old || old.cols !== grid.cols || old.rows !== grid.rows
    if (fresh) {
      const count = grid.cols * grid.rows
      weights = new Float32Array(count)
      attention = new Float32Array(count)
      target = new Float32Array(count)
      boost = new Float32Array(count)
    }
    fade = intro.fadeMap(grid, cells)
    copy = copyMask(grid, m.copy, cells)
    renderer.resize(grid, width, height, window.devicePixelRatio || 1)
    updateTarget(performance.now(), 0)
    // New arrays start from the targets; either way the name keeps its eased state.
    if (fresh || reduced) weights.set(target)
    intro.moveName(weights, fresh ? new Int32Array(0) : oldCells, cells, saved, target)
    draw()
  }

  const tick = (dt: number, now: number) => {
    if (!grid) return
    clock += dt
    updateTarget(now, dt)
    easeToward(weights, target, EASE_RATE, dt)
    pruneRipples(state, now, DROP.lifetime * 1000)
    applyBoost(boost, grid, state.ripples, now)
    draw()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  // Font loading can reflow the copy and move the name without resizing the canvas.
  if (anchor?.parentElement) resizeObserver.observe(anchor.parentElement)
  resize()

  if (reduced) {
    return () => resizeObserver.disconnect()
  }

  // The intro starts now, not at `load`: the static name is already hidden.
  // Idle frames drop to ~30fps once the light has settled near its path.
  const settled = () => {
    const now = performance.now()
    if (!grid || !query || clock < intro.INTRO_END || !isIdle(state, now)) return false
    return isSettled(query, goal(now), grid.pitch)
  }
  const loop = createLoop(root, tick, settled)
  const unbind = bindInput(root, canvas, state)
  loop.start()

  return () => {
    loop.stop()
    unbind()
    resizeObserver.disconnect()
  }
}

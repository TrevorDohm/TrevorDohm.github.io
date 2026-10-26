import { prefersReducedMotion } from '../motion/prefers-reduced-motion'
import { attentionWeights, easeToward } from './attention'
import { applyBoost, idlePoint, RIPPLE } from './effects'
import { layoutGrid, type Grid } from './geometry'
import { bindInput } from './input'
import * as intro from './intro'
import { createLoop } from './loop'
import { readPalette } from './palette'
import { createRenderer, type Renderer } from './renderer'
import { createState, isIdle, pruneRipples } from './state'

/** Softmax temperature in cells. Higher spreads the glow wider. */
const TEMPERATURE = 1.6
/** How quickly the glow follows the query, per second. */
const EASE_RATE = 7
/** Brightness added to the hovered cell's row and column. */
const AXIS_BOOST = 0.12
/** Fallback pitch when the name anchor is missing: phones, then wider screens. */
const FALLBACK_PITCH = [22, 40] as const
const MOBILE_BREAKPOINT = 768

/**
 * Mounts the attention matrix on the canvas inside `root`. The grid is laid out
 * from the static name (`[data-name-anchor]`) so the live name lands on it.
 * Returns cleanup.
 */
export function init(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-matrix-canvas]')
  if (!canvas) return () => {}
  const anchor = root.querySelector<SVGElement>('[data-name-anchor]')

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
  let layoutKey = ''
  let width = 0
  let height = 0
  // Intro clock in seconds, from now. Reduced motion holds it on the lit name.
  const painted = performance.getEntriesByType('paint').length > 0
  let clock = reduced ? intro.STILL_AT : intro.introStart(painted)

  const updateTarget = (now: number) => {
    if (!grid) return
    if (isIdle(state, now) || !state.hasQuery) {
      const idle = idlePoint(Math.max(0, clock - intro.BREAK_AT), 0, 0, width, height)
      ;[state.query.x, state.query.y] = intro.introQuery(clock, centre, idle)
    }
    attentionWeights(grid.centers, grid.pitch, state.query.x, state.query.y, TEMPERATURE, attention)
    if (reduced) attention.fill(0) // still: only the name is lit
    intro.composeTargets(target, attention, grid, cells, clock)
  }

  const draw = () => {
    renderer.draw({ weights, boost, fade })
    // The canvas now shows the name, so the static one can hide (it stays in flow).
    root.dataset.matrixReady = ''
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return // not laid out yet, or hidden
    const box = anchor?.getBoundingClientRect()
    const named = !!box && box.width > 0 && box.height > 0
    const pitch = named ? box.width / intro.NAME.cols : FALLBACK_PITCH[rect.width < MOBILE_BREAKPOINT ? 0 : 1]
    const ax = named ? box.left - rect.left : 0
    const ay = named ? box.top - rect.top : 0
    const key = [rect.width, rect.height, pitch, ax, ay].map((v) => v.toFixed(2)).join()
    if (key === layoutKey) return
    layoutKey = key
    width = rect.width
    height = rect.height

    const saved = Float32Array.from(cells, (i) => (i >= 0 ? weights[i] : NaN))
    const oldCells = cells
    grid = layoutGrid(width, height, pitch, ax, ay)
    cells = named ? intro.nameCells(grid, ax, ay) : new Int32Array(0)
    centre = named
      ? [ax + (pitch * intro.NAME.cols) / 2, ay + (pitch * intro.NAME.rows) / 2]
      : [width / 2, height / 2]
    const count = grid.cols * grid.rows
    const fresh = count !== weights.length
    if (fresh) {
      weights = new Float32Array(count)
      attention = new Float32Array(count)
      target = new Float32Array(count)
      boost = new Float32Array(count)
    }
    fade = intro.fadeMap(grid)
    renderer.resize(grid, width, height, window.devicePixelRatio || 1)
    updateTarget(performance.now())
    // New arrays start from the targets; either way the name keeps its eased state.
    if (fresh || reduced) weights.set(target)
    intro.moveName(weights, fresh ? new Int32Array(0) : oldCells, cells, saved, target)
    draw()
  }

  const tick = (dt: number, now: number) => {
    if (!grid) return
    clock += dt
    updateTarget(now)
    easeToward(weights, target, EASE_RATE, dt)
    pruneRipples(state, now, RIPPLE.lifetime * 1000)
    applyBoost(boost, grid, isIdle(state, now) ? -1 : state.hover, state.ripples, now, AXIS_BOOST)
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
  const loop = createLoop(root, tick, () => clock >= intro.INTRO_END && isIdle(state, performance.now()))
  const unbind = bindInput(root, canvas, state, () => grid)
  loop.start()

  return () => {
    loop.stop()
    unbind()
    resizeObserver.disconnect()
  }
}

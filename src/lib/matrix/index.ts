import { attentionWeights, easeToward } from './attention'
import { parseHex } from './color'
import { applyBoost, idlePoint, RIPPLE } from './effects'
import { layoutGrid, type Grid } from './geometry'
import { bindInput } from './input'
import { createLoop } from './loop'
import { createRenderer, type Palette, type Renderer } from './renderer'
import { createState, isIdle, pruneRipples } from './state'

/** Softmax temperature in cells. Higher spreads the glow wider. */
const TEMPERATURE = 1.6
/** How quickly the glow follows the query, per second. */
const EASE_RATE = 7
/** Brightness added to the hovered cell's row and column. */
const AXIS_BOOST = 0.12
const INTRO_SECONDS = 1.2

function readPalette(el: Element): Palette {
  const style = getComputedStyle(el)
  const token = (name: string) => parseHex(style.getPropertyValue(name))
  return {
    line: token('--color-line'),
    accent: token('--color-accent'),
    accent2: token('--color-accent-2'),
  }
}

/** Mounts the attention matrix on the canvas inside `root`. Returns cleanup. */
export function init(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-matrix-canvas]')
  if (!canvas) return () => {}

  let renderer: Renderer
  try {
    renderer = createRenderer(canvas, readPalette(root))
  } catch {
    return () => {} // no canvas support or unreadable tokens: the CSS backdrop stays
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const state = createState()
  let grid: Grid | null = null
  let weights = new Float32Array(0)
  let target = new Float32Array(0)
  let boost = new Float32Array(0)
  let width = 0
  let height = 0
  let intro = reduced ? 1 : 0
  let clock = 0

  const updateTarget = (now: number) => {
    if (!grid) return
    if (isIdle(state, now) || !state.hasQuery) {
      const [x, y] = idlePoint(clock, grid.originX, grid.originY, grid.n * grid.pitch)
      state.query.x = x
      state.query.y = y
    }
    attentionWeights(grid.centers, grid.pitch, state.query.x, state.query.y, TEMPERATURE, target)
  }

  const draw = () => {
    renderer.draw({ weights, boost, intro })
    // Dim the CSS backdrop only once cells are actually visible.
    if (intro > 0) root.dataset.matrixReady = ''
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return // not laid out yet, or hidden
    const unchanged = Math.abs(rect.width - width) <= 1 && Math.abs(rect.height - height) <= 1
    if (grid && unchanged) return
    width = rect.width
    height = rect.height
    grid = layoutGrid(width, height)
    const count = grid.n * grid.n
    weights = new Float32Array(count)
    target = new Float32Array(count)
    boost = new Float32Array(count)
    renderer.resize(grid, width, height, window.devicePixelRatio || 1)
    updateTarget(performance.now())
    weights.set(target)
    draw()
  }

  const tick = (dt: number, now: number) => {
    if (!grid) return
    clock += dt
    intro = Math.min(1, intro + dt / INTRO_SECONDS)
    updateTarget(now)
    easeToward(weights, target, EASE_RATE, dt)
    pruneRipples(state, now, RIPPLE.lifetime * 1000)
    applyBoost(boost, grid, isIdle(state, now) ? -1 : state.hover, state.ripples, now, AXIS_BOOST)
    draw()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  if (reduced) {
    return () => resizeObserver.disconnect()
  }

  const loop = createLoop(root, tick, () => intro >= 1 && isIdle(state, performance.now()))
  const unbind = bindInput(root, canvas, state, () => grid)
  const start = () => loop.start()
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })

  return () => {
    window.removeEventListener('load', start)
    loop.stop()
    unbind()
    resizeObserver.disconnect()
  }
}

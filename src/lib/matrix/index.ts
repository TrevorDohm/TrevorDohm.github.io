import { prefersReducedMotion } from '../motion/prefers-reduced-motion'
import { attentionWeights, easeToward } from './attention'
import { applyBoost, DROP } from './effects'
import { bindInput } from './input'
import * as intro from './intro'
import { createLoop } from './loop'
import { measure } from './measure'
import { createLight, cruiseSpeed, goalAt, isFollowing, isSettled, stepLight } from './query'
import { readPalette } from './palette'
import { createRenderer, type Renderer } from './renderer'
import { carryName, layoutScene, type Scene } from './scene'
import { markSeen, readSeen } from './seen'
import { createState, isIdle, pruneRipples } from './state'
import { introPlan, seenBy } from './visit'
import { watchLayout } from './watch'

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
  const showCopy = () => root.toggleAttribute('data-copy-shown', true)
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-matrix-canvas]')
  if (!canvas) {
    showCopy()
    return () => {}
  }
  const anchor = root.querySelector<SVGElement>('[data-name-anchor]')
  const copyEls = [...root.querySelectorAll('[data-matrix-copy]')]

  let renderer: Renderer
  try {
    renderer = createRenderer(canvas, readPalette(root))
  } catch {
    showCopy() // no canvas support or unreadable tokens: the static name stays
    return () => {}
  }

  const reduced = prefersReducedMotion()
  const state = createState()
  let scene: Scene | null = null
  let layoutKey = ''
  const light = createLight() // the light's centre (light.q); it glides, never jumps
  // Intro clock (s): dark, or lit in the hold if the intro played earlier this
  // session or the CSS safety net showed the static name.
  const seen = readSeen()
  const shown = !reduced && !!anchor && getComputedStyle(anchor).opacity !== '0'
  const plan = introPlan({ still: reduced, shown, seen })
  let clock = plan.clock
  let copyShown = plan.copyNow && showCopy()
  let marked = seen

  const goal = (s: Scene, now: number) => goalAt(state, now, clock, s.centre, s.width, s.height, s.at.floor, s.at.ceiling)

  const updateTarget = (s: Scene, now: number, dt: number) => {
    const { grid, attention } = s
    const cruise = cruiseSpeed(s.width, s.height, s.at.floor, s.at.ceiling)
    const query = stepLight(light, goal(s, now), isFollowing(state, now), dt, cruise, grid.pitch)
    attentionWeights(grid.centers, grid.pitch, query[0], query[1], TEMPERATURE, attention)
    if (reduced) attention.fill(0) // still: only the name is lit
    intro.composeTargets(s.target, attention, grid, s.cells, clock)
  }

  const draw = ({ weights, boost, fade, copy }: Scene) => {
    renderer.draw({ weights, boost, fade, copy })
    // The canvas now shows the name, so the static one can hide (it stays in flow).
    root.dataset.matrixReady = ''
    // The copy fades in as the name finishes forming (CSS, under data-js-intro).
    if (!copyShown && clock >= intro.COPY_AT) copyShown = showCopy()
  }

  const resize = () => {
    const m = measure(root, canvas, anchor, copyEls)
    if (!m || m.key === layoutKey) return
    layoutKey = m.key
    const prev = scene
    const s = layoutScene(m, prev)
    scene = s
    renderer.resize(s.grid, m.width, m.height, window.devicePixelRatio || 1)
    updateTarget(s, performance.now(), 0)
    carryName(s, prev, reduced)
    draw(s)
  }

  const tick = (dt: number, now: number) => {
    if (!scene) return
    clock += dt
    if (!marked && seenBy(clock)) {
      marked = true
      markSeen()
    }
    updateTarget(scene, now, dt)
    easeToward(scene.weights, scene.target, EASE_RATE, dt)
    pruneRipples(state, now, DROP.lifetime * 1000)
    applyBoost(scene.boost, scene.grid, state.ripples, now)
    draw(scene)
  }

  const stopWatching = watchLayout(canvas, copyEls, resize)
  resize()
  if (!scene) copyShown = showCopy() // unmeasurable: show the copy now, not at the 3 s net

  if (reduced) {
    return stopWatching
  }

  // The intro starts now, not at `load`. Idle frames drop to ~30fps once the light settles.
  const settled = () => {
    const now = performance.now()
    if (!scene || !light.q || clock < intro.INTRO_END || !isIdle(state, now)) return false
    return isSettled(light.q, goal(scene, now), scene.grid.pitch)
  }
  const loop = createLoop(root, tick, settled)
  const unbind = bindInput(root, canvas, state)
  loop.start()

  return () => {
    loop.stop()
    unbind()
    stopWatching()
  }
}

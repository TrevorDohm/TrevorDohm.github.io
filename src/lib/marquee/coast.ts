import { coast, driftVelocity } from './drag-math'
import { scrub } from './scrub'

/** Momentum friction, per second: a 1500 px/s fling coasts about 500 px. */
const FRICTION = 3
/** Momentum ends below this extra speed, in px/s. */
const REST_PX_S = 2

export interface CoastHooks {
  /** Whether the rows would be playing, ignoring any drag. */
  running: () => boolean
  /** The current playback rate (hover eases it). */
  rate: () => number
}

/** Momentum for released rows: each coasts on its own frame loop until it slows to rest. */
export function coaster(hooks: CoastHooks) {
  const coasting = new Map<HTMLElement, { v: number; last: number; raf: number }>()

  /** Stops a row coasting; returns the extra speed it had. */
  const stopCoast = (r: HTMLElement) => {
    const state = coasting.get(r)
    cancelAnimationFrame(state?.raf ?? 0)
    coasting.delete(r)
    return state?.v ?? 0
  }

  // Coast on the extra speed over the drift, so the hand-off to the drift is seamless.
  const startCoast = (r: HTMLElement, v: number) => {
    const drift = hooks.running() ? driftVelocity(Number(r.dataset.speed), hooks.rate(), r.hasAttribute('data-reverse')) : 0
    const state = { v: v - drift, last: performance.now(), raf: 0 }
    const frame = (now: number) => {
      const step = coast(state.v, FRICTION, (now - state.last) / 1000)
      state.v = step.v
      state.last = now
      scrub(r, step.dx)
      if (Math.abs(state.v) < REST_PX_S) coasting.delete(r)
      else state.raf = requestAnimationFrame(frame)
    }
    if (Math.abs(state.v) < REST_PX_S) return
    coasting.set(r, state)
    state.raf = requestAnimationFrame(frame)
  }

  return { startCoast, stopCoast }
}

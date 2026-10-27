const usable = (n: number) => Number.isFinite(n) && n > 0

/**
 * The change in a row's animation time, in the duration's unit, that moves
 * its content `dxPx` (positive is right). A forward loop runs translateX from
 * 0 to -trackPx, so moving content right steps it back in time; a reversed
 * loop runs the other way. 0 for unusable sizes.
 */
export function scrubDelta(dxPx: number, duration: number, trackPx: number, reverse: boolean): number {
  if (!usable(duration) || !usable(trackPx) || dxPx === 0) return 0
  const delta = (dxPx * duration) / trackPx
  return reverse ? delta : -delta
}

/** `t` wrapped into one loop, 0 up to (not including) `period`. 0 for an unusable period. */
export function wrapTime(t: number, period: number): number {
  if (!usable(period)) return 0
  const wrapped = ((t % period) + period) % period
  return wrapped === period ? 0 : wrapped
}

/**
 * One step of momentum with exponential friction (per second). Returns the
 * new velocity and the exact distance covered over the step, so any frame
 * rate traces the same path.
 */
export function coast(v: number, friction: number, dtSeconds: number): { v: number; dx: number } {
  if (!(dtSeconds > 0)) return { v, dx: 0 }
  const keep = Math.exp(-friction * dtSeconds)
  return { v: v * keep, dx: (v * (1 - keep)) / friction }
}

/**
 * Which way a press is moving once it has gone `threshold` px: 'x' for a
 * mostly horizontal drag, 'y' otherwise (ties go to the page scroll). null
 * until then.
 */
export function dragIntent(dx: number, dy: number, threshold: number): 'x' | 'y' | null {
  if (Math.hypot(dx, dy) < threshold) return null
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}

/** A touch swipe is the carousel's while |dx| >= SWIPE_BIAS |dy|, so within about 59 degrees of horizontal. */
const SWIPE_BIAS = 0.6

/**
 * Which way a touch is moving once it has gone `threshold` px. Biased toward
 * the carousel ('x'), since a thumb's sideways swipe is rarely level; a
 * steeper one is a page scroll ('y'). null until then.
 */
export function swipeIntent(dx: number, dy: number, threshold: number): 'x' | 'y' | null {
  if (Math.hypot(dx, dy) < threshold) return null
  return Math.abs(dx) >= SWIPE_BIAS * Math.abs(dy) ? 'x' : 'y'
}

/**
 * What a touch's move means for the carousel: 'wait' below `threshold`,
 * 'scrub' for a swipe the page hasn't claimed, 'yield' for a page scroll. A
 * touchmove that is not `cancelable` means the browser is already scrolling,
 * so even a horizontal swipe yields rather than moving both.
 */
export function touchDecision(move: { dx: number; dy: number; cancelable: boolean }, threshold: number): 'wait' | 'scrub' | 'yield' {
  const intent = swipeIntent(move.dx, move.dy, threshold)
  if (intent === null) return 'wait'
  return intent === 'x' && move.cancelable ? 'scrub' : 'yield'
}

/** A touch that never travels this far from its start is a tap, even if it nudged the row. */
const TAP_SLOP_PX = 8

/** Whether a touch whose furthest travel from its start was `maxTravelPx` counts as a tap. */
export function isTap(maxTravelPx: number): boolean {
  return maxTravelPx < TAP_SLOP_PX
}

/**
 * Pointer velocity in px/s: the least-squares slope of x over time for the
 * move samples in the last `windowMs` before `now` (times in ms). A fit over
 * every sample, rather than the first and last, keeps one jittery reading
 * from dominating. If the last move is more than `stopMs` before `now`, the
 * pointer had stopped, so it is 0 (as Android's VelocityTracker assumes).
 */
export function fitVelocity(
  samples: readonly { t: number; x: number }[],
  now: number,
  windowMs: number,
  stopMs: number,
): number {
  const recent = samples.filter((s) => now - s.t <= windowMs)
  if (recent.length < 2 || now - recent[recent.length - 1].t > stopMs) return 0
  const tMean = recent.reduce((a, s) => a + s.t, 0) / recent.length
  const xMean = recent.reduce((a, s) => a + s.x, 0) / recent.length
  let num = 0, den = 0
  for (const s of recent) {
    num += (s.t - tMean) * (s.x - xMean)
    den += (s.t - tMean) ** 2
  }
  return den > 0 ? (num / den) * 1000 : 0
}

/** Above this speed (px/s), a press that catches a coasting row is a catch, not a tap. */
const CATCH_PX_S = 50

/** Whether the tap that stops a row coasting at `v` px/s should be swallowed, as native scroll views do. */
export function catchSwallowsTap(v: number): boolean {
  return Math.abs(v) > CATCH_PX_S
}

/** Content velocity in px/s of a row drifting at `speed` px/s and playback `rate`. */
export function driftVelocity(speed: number, rate: number, reverse: boolean): number {
  if (!usable(speed)) return 0
  return reverse ? speed * rate : -speed * rate
}

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

/**
 * Pointer velocity in px/s over the samples in the last `windowMs` before
 * `now` (times in ms). 0 if the pointer had stopped or there is too little data.
 */
export function releaseVelocity(samples: readonly { t: number; x: number }[], now: number, windowMs: number): number {
  const recent = samples.filter((s) => now - s.t <= windowMs)
  if (recent.length < 2) return 0
  const first = recent[0]
  const last = recent[recent.length - 1]
  const dt = last.t - first.t
  return dt > 0 ? ((last.x - first.x) / dt) * 1000 : 0
}

/** Content velocity in px/s of a row drifting at `speed` px/s and playback `rate`. */
export function driftVelocity(speed: number, rate: number, reverse: boolean): number {
  if (!usable(speed)) return 0
  return reverse ? speed * rate : -speed * rate
}

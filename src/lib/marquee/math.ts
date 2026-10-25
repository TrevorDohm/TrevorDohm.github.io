const usable = (n: number) => Number.isFinite(n) && n > 0

/** Seconds for a track of `trackPx` to scroll once at `pxPerSec`. 0 for unusable input. */
export function durationSeconds(trackPx: number, pxPerSec: number): number {
  return usable(trackPx) && usable(pxPerSec) ? trackPx / pxPerSec : 0
}

/** How many copies of the content are needed to cover the viewport. At least 1. */
export function repeatsNeeded(contentPx: number, viewportPx: number): number {
  if (!usable(contentPx) || !usable(viewportPx)) return 1
  return Math.max(1, Math.ceil(viewportPx / contentPx))
}

/**
 * Maps a playback time onto a new loop duration, keeping the progress
 * fraction and wrapping past one loop. Same unit in and out. 0 if `oldDur` is not positive.
 */
export function rescaleCurrentTime(t: number, oldDur: number, newDur: number): number {
  if (!usable(oldDur) || !usable(newDur)) return 0
  const scaled = (t / oldDur) * newDur
  return ((scaled % newDur) + newDur) % newDur
}

/**
 * Moves `current` toward `target` by 1 - exp(-rate * dt), so the motion looks
 * the same at any frame rate. `rate` is per second.
 */
export function approach(current: number, target: number, ratePerSec: number, dtSeconds: number): number {
  return current + (target - current) * (1 - Math.exp(-ratePerSec * dtSeconds))
}

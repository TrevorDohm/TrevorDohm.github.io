/** Frame length while idle: about 30fps. */
const IDLE_FRAME_MS = 1000 / 30
/** Longest step passed to tick, so a resumed loop doesn't jump. */
const MAX_STEP_MS = 100

export interface Loop {
  start(): void
  stop(): void
}

/**
 * Calls `tick` on animation frames while the root is on screen and the tab is
 * visible. When `shouldThrottle()` is true, frames are capped at ~30fps.
 * `stop()` cancels the loop and removes its observers.
 */
export function createLoop(
  root: Element,
  tick: (dtSeconds: number, now: number) => void,
  shouldThrottle: () => boolean,
): Loop {
  let raf = 0
  let last = 0
  let wanted = false
  let onScreen = true

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const elapsed = now - last
    if (shouldThrottle() && elapsed < IDLE_FRAME_MS) return
    tick(Math.min(elapsed, MAX_STEP_MS) / 1000, now)
    last = now
  }

  const sync = () => {
    const run = wanted && onScreen && !document.hidden
    if (run && !raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    } else if (!run && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    sync()
  })
  observer.observe(root)
  document.addEventListener('visibilitychange', sync)

  return {
    start() {
      wanted = true
      sync()
    },
    stop() {
      wanted = false
      sync()
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    },
  }
}

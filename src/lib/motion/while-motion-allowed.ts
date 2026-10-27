/** The parts of a MediaQueryList this helper uses, so tests can pass a fake. */
interface Query {
  readonly matches: boolean
  addEventListener(type: 'change', listener: () => void): void
  removeEventListener(type: 'change', listener: () => void): void
}

/**
 * Runs `start` while the visitor allows motion. Turning reduced motion on
 * runs the cleanup `start` returned; turning it off calls `start` again. The
 * returned function stops the behavior and stops listening.
 */
export function whileMotionAllowed(
  start: () => () => void,
  query: Query = window.matchMedia('(prefers-reduced-motion: reduce)'),
): () => void {
  let stop: (() => void) | null = null
  const apply = () => {
    if (query.matches && stop) {
      stop()
      stop = null
    } else if (!query.matches && !stop) {
      stop = start()
    }
  }
  apply()
  query.addEventListener('change', apply)
  return () => {
    query.removeEventListener('change', apply)
    stop?.()
    stop = null
  }
}

import { indexAt } from './math'

/** How often the hover is re-tested under a still pointer while the items drift past it. */
const RECHECK_MS = 100

/** Hit-tests `els` at (x, y) by geometry; null if none is under the point. */
function elementAt<T extends Element>(els: readonly T[], x: number, y: number): T | null {
  return els[indexAt(els.map((el) => el.getBoundingClientRect()), x, y)] ?? null
}

/**
 * Marks the item under the pointer with data-hover, and the link under it
 * too. Inert copies get no pointer events (so no :hover), so both are found
 * by geometry. The items keep drifting under a still pointer, so while the
 * pointer is over a row the test reruns every RECHECK_MS on its last position.
 * Wire `onMove` to pointermove and `onLeave` to pointerleave on each row.
 */
export function hoverItems() {
  let item: Element | null = null
  let link: Element | null = null
  let at: { row: HTMLElement; x: number; y: number } | null = null
  let timer = 0

  const mark = (prev: Element | null, next: Element | null) => {
    if (prev !== next) {
      prev?.removeAttribute('data-hover')
      next?.setAttribute('data-hover', '')
    }
    return next
  }
  const test = () => {
    const items = at ? [...at.row.querySelectorAll(':scope > ul > li')] : []
    const hit = at ? elementAt(items, at.x, at.y) : null
    item = mark(item, hit)
    link = mark(link, hit && at ? elementAt([...hit.querySelectorAll('a[href]')], at.x, at.y) : null)
  }

  const onMove = (event: PointerEvent) => {
    at = { row: event.currentTarget as HTMLElement, x: event.clientX, y: event.clientY }
    test()
    if (!timer) timer = window.setInterval(test, RECHECK_MS)
  }
  const onLeave = () => {
    at = null
    window.clearInterval(timer)
    timer = 0
    test()
  }
  return { onMove, onLeave }
}

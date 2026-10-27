import { isTap, touchDecision } from './drag-math'
import type { Gesture } from './gesture'

/** Movement before a touch picks a direction, kept small so the choice comes before the browser starts scrolling. */
const DECIDE_PX = 4

/**
 * Touch input for the rows, through touch events rather than pointer events:
 * iOS Safari claims any touch with an early vertical component for scrolling
 * under touch-action: pan-y and cancels the pointer. Here a non-passive
 * touchmove picks the direction once the touch has moved DECIDE_PX; a swipe
 * within about 59 degrees of horizontal is the carousel's, and every later
 * touchmove of it is prevented so the page holds still. A steeper one is left
 * to scroll, as is a swipe the browser had already started scrolling. A
 * touch that stays within a few px is a tap and still clicks. A second
 * finger ends the drag so pinch zoom works.
 */
export function touchInput(rows: HTMLElement[], g: Gesture): () => void {
  let id = -1
  let decided = false, travel = 0

  const ours = (event: TouchEvent) => Array.from(event.changedTouches).find((t) => t.identifier === id)
  const stop = (event: TouchEvent, release: boolean) => {
    if (id === -1) return
    id = -1
    g.finish(event.timeStamp, release, isTap(travel))
  }

  const onStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return stop(event, false)
    const t = event.changedTouches[0]
    if (g.press(event.currentTarget as HTMLElement, t.clientX, t.clientY, event.timeStamp)) {
      id = t.identifier
      decided = false
      travel = 0
    }
  }

  const onMove = (event: TouchEvent) => {
    const t = ours(event)
    if (!t || !g.row) return
    g.track([{ t: event.timeStamp, x: t.clientX }], event.timeStamp)
    const dx = t.clientX - g.startX, dy = t.clientY - g.startY
    travel = Math.max(travel, Math.hypot(dx, dy))
    if (!decided) {
      const decision = touchDecision({ dx, dy, cancelable: event.cancelable }, DECIDE_PX)
      if (decision === 'wait') return
      if (decision === 'yield') return stop(event, false) // the page scrolls; this touch is done here
      decided = true
      g.begin()
    }
    if (event.cancelable) event.preventDefault()
    g.move(t.clientX)
  }

  const onEnd = (event: TouchEvent) => {
    if (ours(event)) stop(event, event.type === 'touchend')
  }

  const passive = { passive: true }
  const active = { passive: false }
  for (const r of rows) {
    r.addEventListener('touchstart', onStart, passive)
    r.addEventListener('touchmove', onMove, active)
    r.addEventListener('touchend', onEnd, passive)
    r.addEventListener('touchcancel', onEnd, passive)
  }
  return () => {
    for (const r of rows) {
      r.removeEventListener('touchstart', onStart)
      r.removeEventListener('touchmove', onMove)
      r.removeEventListener('touchend', onEnd)
      r.removeEventListener('touchcancel', onEnd)
    }
  }
}

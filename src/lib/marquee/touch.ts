import { swipeIntent } from './drag-math'
import type { Gesture } from './gesture'

/** Movement before a touch picks a direction. Below iOS's own scroll slop, so the choice comes first. */
const DECIDE_PX = 4

/**
 * Touch input for the rows, through touch events rather than pointer events:
 * iOS Safari claims any touch with an early vertical component for scrolling
 * under touch-action: pan-y and cancels the pointer. Here a non-passive
 * touchmove picks the direction once the touch has moved DECIDE_PX; a swipe
 * within about 59 degrees of horizontal is the carousel's, and every later
 * touchmove of it is prevented so the page holds still. A steeper one is left
 * to scroll. A second finger ends the drag so pinch zoom works.
 */
export function touchInput(rows: HTMLElement[], g: Gesture): () => void {
  let id = -1
  let decided: 'x' | 'y' | null = null

  const ours = (event: TouchEvent) => Array.from(event.changedTouches).find((t) => t.identifier === id)
  const stop = (event: TouchEvent, release: boolean) => {
    if (id === -1) return
    id = -1
    g.finish(event.timeStamp, release)
  }

  const onStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return stop(event, false)
    const t = event.changedTouches[0]
    if (g.press(event.currentTarget as HTMLElement, t.clientX, t.clientY, event.timeStamp)) {
      id = t.identifier
      decided = null
    }
  }

  const onMove = (event: TouchEvent) => {
    const t = ours(event)
    if (!t || !g.row) return
    g.track([{ t: event.timeStamp, x: t.clientX }], event.timeStamp)
    if (decided === null) {
      decided = swipeIntent(t.clientX - g.startX, t.clientY - g.startY, DECIDE_PX)
      if (decided === null) return
      if (decided === 'y') return stop(event, false) // the page scrolls; this touch is done here
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

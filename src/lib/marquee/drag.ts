import { dragIntent } from './drag-math'
import { createGesture, type GestureHooks } from './gesture'
import { touchInput } from './touch'

/** Movement before a mouse or pen press counts as a drag, so a click is left alone. */
const THRESHOLD_PX = 7

/**
 * Lets the pointer move `rows`: a horizontal drag (mouse, pen) or swipe
 * (touch, see touch.ts) scrubs a row 1:1, and on release it coasts with
 * exponential friction before the drift takes over. Vertical swipes still
 * scroll the page. The click that ends a drag, or a tap that catches a
 * coasting row, is swallowed so links don't open. Only acts once `root` is
 * in ready mode.
 */
export function dragRows(root: HTMLElement, rows: HTMLElement[], hooks: GestureHooks) {
  const g = createGesture(root, hooks)
  const stopTouch = touchInput(rows, g)
  let pointerId = -1

  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !event.isPrimary) return // touch goes through touch.ts
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (g.press(event.currentTarget as HTMLElement, event.clientX, event.clientY, event.timeStamp))
      pointerId = event.pointerId
  }

  const onMove = (event: PointerEvent) => {
    const row = g.row
    if (!row || event.pointerId !== pointerId) return
    const coalesced = event.getCoalescedEvents?.() ?? []
    g.track((coalesced.length ? coalesced : [event]).map((e) => ({ t: e.timeStamp, x: e.clientX })), event.timeStamp)
    if (!g.dragging) {
      // A press released outside the row never sends pointerup here; drop it.
      if (event.currentTarget !== row || (event.pointerType === 'mouse' && !(event.buttons & 1))) return end(event, false)
      const intent = dragIntent(event.clientX - g.startX, event.clientY - g.startY, THRESHOLD_PX)
      if (intent === 'y') return end(event, false)
      if (intent !== 'x') return
      g.begin()
      row.setPointerCapture(pointerId)
    }
    g.move(event.clientX)
  }

  function end(event: PointerEvent, release: boolean) {
    if (event.pointerId !== pointerId) return
    const row = g.row
    if (row?.hasPointerCapture(pointerId)) row.releasePointerCapture(pointerId)
    pointerId = -1
    g.finish(event.timeStamp, release)
  }
  const onUp = (event: PointerEvent) => end(event, true)
  const onCancel = (event: PointerEvent) => end(event, false)
  const onClick = (event: MouseEvent) => g.onClick(event)
  const onDragStart = (event: DragEvent) => event.preventDefault() // links and images would drag instead

  const events = [['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp],
    ['pointercancel', onCancel], ['dragstart', onDragStart]] as const
  for (const r of rows) {
    for (const [type, fn] of events) r.addEventListener(type, fn as EventListener)
    r.addEventListener('click', onClick, true)
  }

  return {
    /** Whether a drag is holding `r` still. */
    held: (r: HTMLElement) => g.dragging && g.row === r,
    release: () => {
      stopTouch()
      for (const r of rows) {
        for (const [type, fn] of events) r.removeEventListener(type, fn as EventListener)
        r.removeEventListener('click', onClick, true)
      }
      g.release(rows)
      pointerId = -1
    },
  }
}

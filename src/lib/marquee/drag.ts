import { coaster, type CoastHooks } from './coast'
import { catchSwallowsTap, dragIntent, fitVelocity } from './drag-math'
import { scrub } from './scrub'

/** Movement before a press counts as a drag, so a tap or a page scroll is left alone. */
const THRESHOLD_PX = 7
/** Release velocity is fitted over this much of the drag, in ms... */
const VELOCITY_WINDOW_MS = 100
/** ...and is 0 if the pointer hadn't moved for this long before release (about 3 frames at 60 Hz). */
const STOPPED_MS = 50
const MAX_PX_S = 6000
/** The click after a drag (or a catch) arrives within this, in ms; later clicks go through. */
const SWALLOW_MS = 400

interface DragHooks extends CoastHooks {
  /** Called when a row starts or stops being held by a drag. */
  onHold: () => void
}

/**
 * Lets the pointer move `rows`: a horizontal drag or swipe scrubs a row 1:1,
 * and on release it coasts with exponential friction before the drift takes
 * over. Vertical swipes still scroll the page. The click that ends a drag, or
 * a tap that catches a coasting row, is swallowed so links don't open. Only
 * acts once `root` is in ready mode.
 */
export function dragRows(root: HTMLElement, rows: HTMLElement[], hooks: DragHooks) {
  let row: HTMLElement | null = null // pressed row
  let dragging = false, pointerId = -1, startX = 0, startY = 0, lastX = 0
  let samples: { t: number; x: number }[] = []
  let swallow = false, swallowTimer = 0
  const { startCoast, stopCoast } = coaster(hooks)

  // A pending swallow lasts only until this press's click could arrive, so a later keyboard click still works.
  const armSwallow = () => {
    clearTimeout(swallowTimer)
    if (swallow) swallowTimer = window.setTimeout(() => (swallow = false), SWALLOW_MS)
  }
  const record = (event: PointerEvent) => {
    const coalesced = event.getCoalescedEvents?.() ?? []
    for (const e of coalesced.length ? coalesced : [event]) samples.push({ t: e.timeStamp, x: e.clientX })
    samples = samples.filter((s) => event.timeStamp - s.t <= VELOCITY_WINDOW_MS)
  }

  const onDown = (event: PointerEvent) => {
    if (!('marqueeReady' in root.dataset) || dragging || !event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    row = event.currentTarget as HTMLElement
    clearTimeout(swallowTimer)
    // A press catches a coasting row; if it was moving fast, its tap is a catch, not a click.
    swallow = catchSwallowsTap(stopCoast(row))
    pointerId = event.pointerId
    startX = lastX = event.clientX
    startY = event.clientY
    samples = [{ t: event.timeStamp, x: event.clientX }]
  }

  const onMove = (event: PointerEvent) => {
    if (!row || event.pointerId !== pointerId) return
    record(event)
    if (!dragging) {
      // A press released outside the row never sends pointerup here; drop it.
      if (event.currentTarget !== row || (event.pointerType === 'mouse' && !(event.buttons & 1))) {
        row = null
        pointerId = -1
        return armSwallow()
      }
      const intent = dragIntent(event.clientX - startX, event.clientY - startY, THRESHOLD_PX)
      if (intent === 'y') return end(event, false)
      if (intent !== 'x') return
      dragging = true
      row.setPointerCapture(pointerId)
      row.setAttribute('data-dragging', '')
      hooks.onHold()
      lastX = startX // the content catches up with the pointer, so the drag is 1:1 from the press
    }
    scrub(row, event.clientX - lastX)
    lastX = event.clientX
  }

  function end(event: PointerEvent, release: boolean) {
    if (!row || event.pointerId !== pointerId) return
    const r = row, wasDragging = dragging
    row = null
    dragging = false
    pointerId = -1
    if (wasDragging) {
      if (r.hasPointerCapture(event.pointerId)) r.releasePointerCapture(event.pointerId)
      r.removeAttribute('data-dragging')
      hooks.onHold()
      const v = release ? fitVelocity(samples, event.timeStamp, VELOCITY_WINDOW_MS, STOPPED_MS) : 0
      startCoast(r, Math.max(-MAX_PX_S, Math.min(MAX_PX_S, v)))
      swallow = true // the click that follows this release must not open a link
    }
    armSwallow()
  }
  const onUp = (event: PointerEvent) => end(event, true)
  const onCancel = (event: PointerEvent) => end(event, false)

  const onClick = (event: MouseEvent) => {
    if (!swallow) return
    swallow = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  const onDragStart = (event: DragEvent) => event.preventDefault() // links and images would drag instead

  const events = [['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp],
    ['pointercancel', onCancel], ['dragstart', onDragStart]] as const
  for (const r of rows) {
    for (const [type, fn] of events) r.addEventListener(type, fn as EventListener)
    r.addEventListener('click', onClick, true)
  }

  return {
    /** Whether a drag is holding `r` still. */
    held: (r: HTMLElement) => dragging && row === r,
    release: () => {
      for (const r of rows) {
        for (const [type, fn] of events) r.removeEventListener(type, fn as EventListener)
        r.removeEventListener('click', onClick, true)
        r.removeAttribute('data-dragging')
        stopCoast(r)
      }
      clearTimeout(swallowTimer)
      row = null
      dragging = false
    },
  }
}

import { coast, dragIntent, driftVelocity, releaseVelocity, scrubDelta, wrapTime } from './drag-math'

/** Movement before a press counts as a drag, so a tap or a page scroll is left alone. */
const THRESHOLD_PX = 7
/** Momentum friction, per second: a 1500 px/s fling coasts about 500 px. */
const FRICTION = 3
/** Momentum ends below this extra speed, in px/s. */
const REST_PX_S = 2
/** Release velocity looks back this far, in ms. */
const VELOCITY_WINDOW_MS = 80
const MAX_PX_S = 6000

interface DragHooks {
  /** Whether the rows would be playing, ignoring any drag. */
  running: () => boolean
  /** The current playback rate (hover eases it). */
  rate: () => number
  /** Called when a row starts or stops being held by a drag. */
  onHold: () => void
}

/** Every animation in a row: the track, the clone and the copies inside them. */
export const rowAnims = (row: HTMLElement) =>
  Array.from(row.querySelectorAll<HTMLElement>(':scope > ul')).flatMap((list) => list.getAnimations())

/** Moves a row's content `dx` px by seeking every list in it by the same time. */
function scrub(row: HTMLElement, dx: number) {
  const track = row.querySelector<HTMLElement>('ul[data-marquee-track]')
  const width = track?.getBoundingClientRect().width ?? 0
  const reverse = row.hasAttribute('data-reverse')
  for (const animation of rowAnims(row)) {
    const duration = Number(animation.effect?.getComputedTiming().duration)
    const t = animation.currentTime
    if (typeof t !== 'number' || !(duration > 0)) continue
    animation.currentTime = wrapTime(t + scrubDelta(dx, duration, width, reverse), duration)
  }
}

/**
 * Lets the pointer move `rows`: a horizontal drag or swipe scrubs a row 1:1,
 * and on release it coasts with exponential friction before the drift takes
 * over. Vertical swipes still scroll the page. The click that ends a drag is
 * swallowed so links don't open. Only acts once `root` is in ready mode.
 */
export function dragRows(root: HTMLElement, rows: HTMLElement[], hooks: DragHooks) {
  let row: HTMLElement | null = null // pressed row
  let dragging = false, pointerId = -1, startX = 0, startY = 0, lastX = 0
  let samples: { t: number; x: number }[] = []
  let swallow = false, swallowTimer = 0
  const coasting = new Map<HTMLElement, { v: number; last: number; raf: number }>()

  const stopCoast = (r: HTMLElement) => {
    cancelAnimationFrame(coasting.get(r)?.raf ?? 0)
    coasting.delete(r)
  }

  // Coast on the extra speed over the drift, so the hand-off to the drift is seamless.
  const startCoast = (r: HTMLElement, v: number) => {
    const drift = hooks.running() ? driftVelocity(Number(r.dataset.speed), hooks.rate(), r.hasAttribute('data-reverse')) : 0
    const state = { v: v - drift, last: performance.now(), raf: 0 }
    const frame = (now: number) => {
      const step = coast(state.v, FRICTION, (now - state.last) / 1000)
      state.v = step.v
      state.last = now
      scrub(r, step.dx)
      if (Math.abs(state.v) < REST_PX_S) coasting.delete(r)
      else state.raf = requestAnimationFrame(frame)
    }
    if (Math.abs(state.v) < REST_PX_S) return
    coasting.set(r, state)
    state.raf = requestAnimationFrame(frame)
  }

  const onDown = (event: PointerEvent) => {
    if (!('marqueeReady' in root.dataset) || dragging || !event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    row = event.currentTarget as HTMLElement
    stopCoast(row) // a press catches a coasting row, as native scrolling does
    pointerId = event.pointerId
    startX = lastX = event.clientX
    startY = event.clientY
    samples = [{ t: event.timeStamp, x: event.clientX }]
    swallow = false
  }

  const onMove = (event: PointerEvent) => {
    if (!row || event.pointerId !== pointerId) return
    if (!dragging) {
      // A press released outside the row never sends pointerup here; drop it.
      if (event.currentTarget !== row || (event.pointerType === 'mouse' && !(event.buttons & 1))) {
        row = null
        return
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
    samples.push({ t: event.timeStamp, x: event.clientX })
    if (samples.length > 16) samples.shift()
  }

  function end(event: PointerEvent, release: boolean) {
    if (!row || event.pointerId !== pointerId) return
    const r = row, wasDragging = dragging
    row = null
    dragging = false
    if (!wasDragging) return
    if (r.hasPointerCapture(pointerId)) r.releasePointerCapture(pointerId)
    r.removeAttribute('data-dragging')
    hooks.onHold()
    const v = release ? releaseVelocity(samples, event.timeStamp, VELOCITY_WINDOW_MS) : 0
    startCoast(r, Math.max(-MAX_PX_S, Math.min(MAX_PX_S, v)))
    // The click that follows this release must not open a link.
    swallow = true
    clearTimeout(swallowTimer)
    swallowTimer = window.setTimeout(() => (swallow = false), 400)
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

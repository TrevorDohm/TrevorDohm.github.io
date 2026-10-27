import { coaster, type CoastHooks } from './coast'
import { catchSwallowsTap, fitVelocity } from './drag-math'
import { scrub } from './scrub'

/** Release velocity is fitted over this much of the drag, in ms... */
const VELOCITY_WINDOW_MS = 100
/** ...and is 0 if the pointer hadn't moved for this long before release (about 3 frames at 60 Hz). */
const STOPPED_MS = 50
const MAX_PX_S = 6000
/** The click after a drag (or a catch) arrives within this, in ms; later clicks go through. */
const SWALLOW_MS = 400

export interface GestureHooks extends CoastHooks {
  /** Called when a row starts or stops being held by a drag. */
  onHold: () => void
}

export type Gesture = ReturnType<typeof createGesture>

/**
 * One press on the rows of `root`, whatever the input: press, track samples,
 * begin dragging once the input decides it is a drag, move, finish. On
 * finish a drag coasts and swallows the click that follows; a press that
 * catches a fast-coasting row swallows its click too, as native scroll views do.
 */
export function createGesture(root: HTMLElement, hooks: GestureHooks) {
  const { startCoast, stopCoast } = coaster(hooks)
  let lastX = 0, swallow = false, swallowTimer = 0
  let samples: { t: number; x: number }[] = []

  // A pending swallow lasts only until this press's click could arrive, so a later keyboard click still works.
  const armSwallow = () => {
    clearTimeout(swallowTimer)
    if (swallow) swallowTimer = window.setTimeout(() => (swallow = false), SWALLOW_MS)
  }

  const g = {
    row: null as HTMLElement | null,
    dragging: false,
    startX: 0,
    startY: 0,
    /** Starts a press on `row`; false if the rows aren't in ready mode or a drag is under way. */
    press(row: HTMLElement, x: number, y: number, t: number): boolean {
      if (!('marqueeReady' in root.dataset) || g.dragging) return false
      g.row = row
      clearTimeout(swallowTimer)
      swallow = catchSwallowsTap(stopCoast(row))
      g.startX = lastX = x
      g.startY = y
      samples = [{ t, x }]
      return true
    },
    /** Adds position samples for the release velocity. */
    track(points: { t: number; x: number }[], now: number) {
      samples.push(...points)
      samples = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS)
    },
    /** The press is a drag: hold the row; the content catches up with the pointer, so it is 1:1 from the press. */
    begin() {
      if (!g.row) return
      g.dragging = true
      g.row.setAttribute('data-dragging', '')
      hooks.onHold()
      lastX = g.startX
    },
    move(x: number) {
      if (!g.row || !g.dragging) return
      scrub(g.row, x - lastX)
      lastX = x
    },
    /** Ends the press. A drag coasts at the release velocity if `release`, else stops. */
    finish(now: number, release: boolean) {
      const r = g.row, wasDragging = g.dragging
      g.row = null
      g.dragging = false
      if (r && wasDragging) {
        r.removeAttribute('data-dragging')
        hooks.onHold()
        const v = release ? fitVelocity(samples, now, VELOCITY_WINDOW_MS, STOPPED_MS) : 0
        startCoast(r, Math.max(-MAX_PX_S, Math.min(MAX_PX_S, v)))
        swallow = true // the click that follows this release must not open a link
      }
      armSwallow()
    },
    onClick(event: MouseEvent) {
      if (!swallow) return
      swallow = false
      event.preventDefault()
      event.stopImmediatePropagation()
    },
    release(rows: HTMLElement[]) {
      for (const r of rows) {
        r.removeAttribute('data-dragging')
        stopCoast(r)
      }
      clearTimeout(swallowTimer)
      g.row = null
      g.dragging = false
    },
  }
  return g
}

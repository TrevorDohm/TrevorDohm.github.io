import { durationSeconds, repeatsNeeded, rescaleCurrentTime } from './math'

interface RowState {
  /** How many children each list had before any copies were added. */
  count: number
  /** How many copies of the content each list holds now. */
  copies: number
  /** Current loop length in seconds. */
  duration: number
}

const states = new WeakMap<HTMLElement, RowState>()

/** Brings `list` to `copies` copies of its first `count` children. Added copies are inert. */
function setCopies(list: HTMLElement, count: number, copies: number) {
  const originals = Array.from(list.children).slice(0, count)
  while (list.children.length > count * copies) list.lastElementChild?.remove()
  while (list.children.length < count * copies) {
    for (const node of originals) {
      const copy = node.cloneNode(true) as HTMLElement
      copy.inert = true
      copy.setAttribute('aria-hidden', 'true')
      list.append(copy)
    }
  }
}

/**
 * Sizes one marquee row: adds copies of the content so each list covers
 * `viewportPx`, then sets `--marquee-duration` so the row moves at `speed`
 * px/s. Running animations keep their place when the duration changes.
 */
export function layoutRow(row: HTMLElement, speed: number, viewportPx: number): void {
  const track = row.querySelector<HTMLElement>('ul[data-marquee-track]')
  const clone = row.querySelector<HTMLElement>('ul[data-marquee-clone]')
  if (!track || !clone) return

  let state = states.get(row)
  if (!state) {
    // First call: the track holds exactly one copy of the content.
    state = { count: track.children.length, copies: 1, duration: 0 }
    states.set(row, state)
  }
  if (state.count === 0) return

  // Copies are identical and the gap is also each list's padding-right, so
  // one copy is exactly the track width over the copy count. Measuring this
  // way keeps the base width current after a font swap or a resize.
  const contentPx = track.scrollWidth / state.copies
  const copies = repeatsNeeded(contentPx, viewportPx)
  if (copies !== state.copies) {
    setCopies(track, state.count, copies)
    setCopies(clone, state.count, copies)
    state.copies = copies
  }

  // Re-measure after the copies are in: one loop is the whole track.
  const duration = durationSeconds(track.scrollWidth, speed)
  if (duration === state.duration) return
  const old = state.duration
  state.duration = duration
  row.style.setProperty('--marquee-duration', `${duration}s`)

  // getAnimations() flushes styles, so these already run on the new duration.
  for (const animation of [...track.getAnimations(), ...clone.getAnimations()]) {
    const t = animation.currentTime
    if (typeof t === 'number' && old > 0) {
      animation.currentTime = rescaleCurrentTime(t, old * 1000, duration * 1000)
    }
  }
}

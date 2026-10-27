import { revealProgress } from './math'

/** Width of the row mask's fade at each edge. Items between the fades are in clear view. */
const FADE_PX = 96

/**
 * Seeks a row's loop so `item`, a real (focusable) item in its track, sits in
 * clear view. Without this, the focused item can be translated out of sight
 * while only its inert twin in a copy is visible. Call it with the row paused.
 */
export function revealItem(row: HTMLElement, item: HTMLElement): void {
  const track = row.querySelector<HTMLElement>('ul[data-marquee-track]')
  const clone = row.querySelector<HTMLElement>('ul[data-marquee-clone]')
  if (!track || !clone || !track.contains(item)) return

  const rowBox = row.getBoundingClientRect()
  const box = item.getBoundingClientRect()
  if (box.left >= rowBox.left + FADE_PX && box.right <= rowBox.right - FADE_PX) return

  // Both boxes include the same transform, so their difference is the item's offset in the list.
  const offset = box.left - track.getBoundingClientRect().left
  const reverse = row.hasAttribute('data-reverse')
  const progress = revealProgress(offset, box.width, row.clientWidth, track.scrollWidth, reverse)
  for (const animation of [...track.getAnimations(), ...clone.getAnimations()]) {
    const duration = Number(animation.effect?.getComputedTiming().duration)
    if (duration > 0) animation.currentTime = progress * duration
  }
}

/**
 * Focus handlers for the rows of one root. Keyboard focus in a row holds it:
 * `onHold(true)`, `data-focus-hold` on the row (which drops its edge mask) and
 * the focused item seeked into view. A mouse click also focuses a link, but
 * must not freeze the row or move the card under the pointer, so only
 * `:focus-visible` focus holds. Moving focus between items keeps the hold.
 */
export function focusHold(root: HTMLElement, rows: HTMLElement[], onHold: (held: boolean) => void) {
  const hold = (row: HTMLElement | null) => {
    for (const r of rows) r.toggleAttribute('data-focus-hold', r === row)
    onHold(row !== null)
  }
  const onFocusIn = (event: FocusEvent) => {
    const row = event.currentTarget as HTMLElement
    const target = event.target as Element
    const held = target.matches(':focus-visible')
    hold(held ? row : null)
    const item = held && target.closest<HTMLElement>('[data-marquee-track] > li')
    if (item && 'marqueeReady' in root.dataset) revealItem(row, item)
  }
  // Focus moving to another item in a row: the focusin that follows decides.
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget
    if (!(next instanceof Element && rows.some((row) => row.contains(next)))) hold(null)
  }
  return { onFocusIn, onFocusOut, release: () => hold(null) }
}

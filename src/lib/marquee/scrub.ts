import { scrubDelta, wrapTime } from './drag-math'

/** Every animation in a row: the track, the clone and the copies inside them. */
export const rowAnims = (row: HTMLElement) =>
  Array.from(row.querySelectorAll<HTMLElement>(':scope > ul')).flatMap((list) => list.getAnimations())

/** Moves a row's content `dx` px (positive is right) by seeking every list in it by the same time. */
export function scrub(row: HTMLElement, dx: number): void {
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

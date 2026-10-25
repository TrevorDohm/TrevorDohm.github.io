import { prefersReducedMotion } from '../motion/prefers-reduced-motion'
import { revealItem } from './focus'
import { approach } from './math'
import { layoutRow } from './timing'

/** Playback rate while the pointer is over a row. */
const HOVER_RATE = 0.25
/** How quickly the rate eases toward its target, per second. */
const EASE_RATE = 4
/** Longest step fed to the easing, so a stalled frame doesn't jump. */
const MAX_STEP_S = 0.1
/** Row attributes that only make sense while the row scrolls by hand. */
const STATIC_ATTRS = ['role', 'tabindex', 'aria-label']

/**
 * Drives every marquee row inside `root`: sizing, hover slowdown, the Pause
 * button and pausing offscreen. Under reduced motion the rows stay static.
 */
export function init(root: HTMLElement): () => void {
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-marquee-row]'))
  if (prefersReducedMotion() || rows.length === 0) return () => {}

  const toggle = root.querySelector<HTMLButtonElement>('button[data-marquee-toggle]')
  const lists = rows.flatMap((row) =>
    Array.from(row.querySelectorAll<HTMLElement>('ul[data-marquee-track], ul[data-marquee-clone]')),
  )
  const anims = () => lists.flatMap((list) => list.getAnimations())
  const saved = rows.map((row) => STATIC_ATTRS.map((name) => row.getAttribute(name)))

  let alive = true, userPaused = false, focusHeld = false, onScreen = true
  let rate = 1, target = 1, raf = 0, last = 0
  let hovered: HTMLElement | null = null

  const layout = () => {
    if (!alive) return
    for (const row of rows) layoutRow(row, Number(row.dataset.speed), row.clientWidth)
    root.dispatchEvent(new CustomEvent('marquee:layout'))
  }

  // One place decides play or pause. Only the button touches userPaused.
  const sync = () => {
    const run = !userPaused && !focusHeld && onScreen && !document.hidden
    anims().forEach((a) => (run ? a.play() : a.pause()))
  }

  const applyRate = () => anims().forEach((a) => a.updatePlaybackRate(rate))
  const step = (now: number) => {
    rate = approach(rate, target, EASE_RATE, Math.min((now - last) / 1000, MAX_STEP_S))
    last = now
    if (Math.abs(rate - target) <= 0.001) {
      rate = target
      raf = 0
    } else {
      raf = requestAnimationFrame(step)
    }
    applyRate()
  }
  const setTarget = (value: number) => {
    target = value
    if (raf || Math.abs(rate - target) <= 0.001) return
    last = performance.now()
    raf = requestAnimationFrame(step)
  }

  // Inert copies get no pointer events, so find the item under the pointer by geometry.
  const setHover = (li: HTMLElement | null) => {
    if (li === hovered) return
    hovered?.removeAttribute('data-hover')
    li?.setAttribute('data-hover', '')
    hovered = li
  }
  const onMove = (event: PointerEvent) => {
    const row = event.currentTarget as HTMLElement
    const items = row.querySelectorAll<HTMLElement>(':scope > ul > li')
    const hit = Array.from(items).find((li) => {
      const r = li.getBoundingClientRect()
      return event.clientX >= r.left && event.clientX < r.right && event.clientY >= r.top && event.clientY < r.bottom
    })
    setHover(hit ?? null)
  }
  const onEnter = () => setTarget(HOVER_RATE)
  const onLeave = () => { setHover(null); setTarget(1) }
  // Focus inside a row holds it still, with the focused item seeked into view.
  // Moving focus between items keeps the hold.
  const onFocus = (event: FocusEvent) => {
    const inside = event.type === 'focusin' ? event.target : event.relatedTarget
    focusHeld = inside instanceof Element && rows.some((row) => row.contains(inside))
    sync()
    const item = event.type === 'focusin' && focusHeld && (inside as Element).closest<HTMLElement>('[data-marquee-track] > li')
    if (item && 'marqueeReady' in root.dataset) revealItem(event.currentTarget as HTMLElement, item)
  }

  // The label says what a press will do. No aria-pressed: with a changing label it reads backwards.
  const onToggle = () => {
    userPaused = !userPaused
    if (toggle) toggle.textContent = userPaused ? 'Play' : 'Pause'
    if (userPaused) root.dataset.marqueePaused = ''
    else delete root.dataset.marqueePaused
    sync()
  }

  const start = () => {
    if (!alive) return
    root.dataset.marqueeReady = ''
    for (const row of rows) for (const name of STATIC_ATTRS) row.removeAttribute(name)
    if (toggle) toggle.hidden = false
    applyRate()
    sync()
  }

  const intersection = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting
    sync()
  })
  const resize = new ResizeObserver(layout)
  const rowEvents = [
    ['pointermove', onMove],
    ['pointerenter', onEnter],
    ['pointerleave', onLeave],
    ['focusin', onFocus],
    ['focusout', onFocus],
  ] as const

  layout()
  document.fonts.ready.then(layout)
  resize.observe(root)
  intersection.observe(root)
  document.addEventListener('visibilitychange', sync)
  toggle?.addEventListener('click', onToggle)
  for (const row of rows) for (const [type, fn] of rowEvents) row.addEventListener(type, fn as EventListener)
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })

  return () => {
    alive = false
    resize.disconnect()
    intersection.disconnect()
    cancelAnimationFrame(raf)
    window.removeEventListener('load', start)
    document.removeEventListener('visibilitychange', sync)
    toggle?.removeEventListener('click', onToggle)
    for (const row of rows) for (const [type, fn] of rowEvents) row.removeEventListener(type, fn as EventListener)
    setHover(null)
    rows.forEach((row, i) => saved[i].forEach((v, j) => v !== null && row.setAttribute(STATIC_ATTRS[j], v)))
    if (toggle) toggle.hidden = true
    delete root.dataset.marqueeReady
    delete root.dataset.marqueePaused
  }
}

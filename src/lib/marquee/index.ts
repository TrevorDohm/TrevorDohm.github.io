import { whileMotionAllowed } from '../motion/while-motion-allowed'
import { dragRows } from './drag'
import { focusHold } from './focus'
import { hoverItems } from './hover'
import { approach, frameStep } from './math'
import { rowAnims } from './scrub'
import { layoutRow, resetRow } from './timing'

/** Playback rate while the pointer is over a row. */
const HOVER_RATE = 0.5
/** How quickly the rate eases toward its target, per second. */
const EASE_RATE = 4
/** Longest step fed to the easing, so a stalled frame doesn't jump. */
const MAX_STEP_S = 0.1
/** Row attributes that only make sense while the row scrolls by hand. */
const STATIC_ATTRS = ['role', 'tabindex', 'aria-label']

/**
 * Drives every marquee row inside `root`: sizing, hover slowdown, dragging,
 * the Pause button and pausing offscreen. Under reduced motion the rows stay static,
 * and turning it on later returns them to static.
 */
export const init = (root: HTMLElement): (() => void) => whileMotionAllowed(() => drive(root))

function drive(root: HTMLElement): () => void {
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-marquee-row]'))
  if (rows.length === 0) return () => {}

  const toggle = root.querySelector<HTMLButtonElement>('button[data-marquee-toggle]')
  // The visible word lives in its own span, beside hidden text naming the section.
  const label = toggle?.querySelector('[data-marquee-label]') ?? toggle
  const anims = () => rows.flatMap(rowAnims)
  const saved = rows.map((row) => STATIC_ATTRS.map((name) => row.getAttribute(name)))

  let alive = true, userPaused = false, focusHeld = false, onScreen = true
  let rate = 1, target = 1, raf = 0, last = 0

  const layout = () => {
    if (!alive) return
    for (const row of rows) layoutRow(row, Number(row.dataset.speed), row.clientWidth)
    root.dispatchEvent(new CustomEvent('marquee:layout'))
  }

  // One place decides play or pause. Only the button touches userPaused; a drag holds its own row.
  const running = () => !userPaused && !focusHeld && onScreen && !document.hidden
  const sync = () =>
    rows.forEach((row) => rowAnims(row).forEach((a) => (running() && !drag.held(row) ? a.play() : a.pause())))
  const drag = dragRows(root, rows, { running, rate: () => rate, onHold: () => sync() })

  const applyRate = () => anims().forEach((a) => a.updatePlaybackRate(rate))
  const step = (now: number) => {
    rate = approach(rate, target, EASE_RATE, frameStep(now, last, MAX_STEP_S))
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

  const hover = hoverItems()
  const onEnter = () => setTarget(HOVER_RATE)
  const onLeave = () => { hover.onLeave(); setTarget(1) }
  const focus = focusHold(root, rows, (held) => {
    focusHeld = held
    sync()
  })

  // The label says what a press will do. No aria-pressed: with a changing label it reads backwards.
  const onToggle = () => {
    userPaused = !userPaused
    if (label) label.textContent = userPaused ? 'Play' : 'Pause'
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
    ['pointermove', hover.onMove],
    ['pointerenter', onEnter],
    ['pointerleave', onLeave],
    ['focusin', focus.onFocusIn],
    ['focusout', focus.onFocusOut],
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
    hover.onLeave()
    focus.release()
    drag.release()
    rows.forEach((row, i) => saved[i].forEach((v, j) => v !== null && row.setAttribute(STATIC_ATTRS[j], v)))
    rows.forEach(resetRow)
    if (label) label.textContent = 'Pause'
    if (toggle) toggle.hidden = true
    delete root.dataset.marqueeReady
    delete root.dataset.marqueePaused
  }
}

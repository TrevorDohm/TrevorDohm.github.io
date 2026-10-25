import { easeToward } from '../matrix/attention'
import { createLoop } from '../matrix/loop'
import { readPalette } from '../matrix/palette'
import type { Palette } from '../matrix/renderer'
import { prefersReducedMotion } from '../motion/prefers-reduced-motion'
import { drawPattern } from './draw'
import { patternWeights, sweepWeights, type PatternId } from './patterns'

const N = 12 // cells per side
const SIZE = 424 // canvas backing px
const SWEEP_ROWS_PER_S = 1.6
const EASE_RATE = 6
const LIVE = 'data-pattern-live'

interface Card {
  base: Float32Array
  current: Float32Array
  target: Float32Array
  queryRow: number
  hoverRow: number | null
  /** The canvas in the real track; every other copy mirrors it. */
  primary: HTMLCanvasElement | null
  mirrors: HTMLCanvasElement[]
}

/**
 * Animates every pattern card inside `root`: a query row sweeps down each
 * map, or follows the pointer over a card. One loop at ~30fps draws each
 * pattern once and copies it to the visible clones. Under reduced motion, or
 * if the palette can't be read, the static SVG frames stay.
 */
export function init(root: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {}
  let palette: Palette
  try {
    palette = readPalette(root)
  } catch {
    return () => {}
  }

  const cards = new Map<PatternId, Card>()
  const owner = new Map<HTMLCanvasElement, Card>()
  const visible = new Set<Element>()
  const drawn = new WeakSet<HTMLCanvasElement>()
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-marquee-row]'))
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)
  })

  // The marquee may add copies at any layout pass, so rebuild the lists each time.
  const collect = () => {
    observer.disconnect()
    visible.clear()
    owner.clear()
    for (const card of cards.values()) {
      card.primary = null
      card.mirrors = []
    }
    for (const canvas of root.querySelectorAll<HTMLCanvasElement>('canvas[data-pattern]')) {
      const id = canvas.dataset.pattern as PatternId
      let card = cards.get(id)
      if (!card) {
        const base = patternWeights(id, N)
        const current = sweepWeights(base, N, N / 2, new Float32Array(N * N)) // the static frame
        const queryRow = (cards.size * 2) % N // staggered, so cards don't sweep in lockstep
        card = { base, current, target: new Float32Array(N * N), queryRow, hoverRow: null, primary: null, mirrors: [] }
        cards.set(id, card)
      }
      const real = canvas.closest('[data-marquee-track]') && !canvas.closest('[inert]')
      if (real && !card.primary) card.primary = canvas
      else card.mirrors.push(canvas)
      // A copy cloned from a live card carries the flag but not the pixels.
      if (!drawn.has(canvas)) canvas.closest('li')?.removeAttribute(LIVE)
      owner.set(canvas, card)
      observer.observe(canvas)
    }
  }

  const markDrawn = (canvas: HTMLCanvasElement) => {
    if (drawn.has(canvas)) return
    drawn.add(canvas)
    canvas.closest('li')?.setAttribute(LIVE, '')
  }

  const tick = (dt: number) => {
    if ('marqueePaused' in root.dataset) return
    for (const card of cards.values()) {
      const { primary } = card
      const shown = card.mirrors.filter((m) => visible.has(m))
      const ctx = primary?.getContext('2d')
      if (!primary || !ctx || (!visible.has(primary) && shown.length === 0)) continue
      card.queryRow = card.hoverRow ?? (card.queryRow + SWEEP_ROWS_PER_S * dt) % N
      sweepWeights(card.base, N, card.queryRow, card.target)
      easeToward(card.current, card.target, EASE_RATE, dt)
      drawPattern(ctx, card.current, N, SIZE, palette)
      markDrawn(primary)
      for (const mirror of shown) {
        const mctx = mirror.getContext('2d')
        if (!mctx) continue
        mctx.clearRect(0, 0, SIZE, SIZE)
        mctx.drawImage(primary, 0, 0)
        markDrawn(mirror)
      }
    }
  }

  // Inert copies get no pointer events, so find the canvas under the pointer by geometry.
  const onMove = (event: PointerEvent) => {
    let hit: Card | undefined, row = 0
    for (const canvas of visible) {
      const r = canvas.getBoundingClientRect()
      if (event.clientX < r.left || event.clientX >= r.right) continue
      if (event.clientY < r.top || event.clientY >= r.bottom) continue
      hit = owner.get(canvas as HTMLCanvasElement)
      row = Math.min(N - 0.01, Math.max(0, ((event.clientY - r.top) / r.height) * N))
    }
    for (const card of cards.values()) card.hoverRow = card === hit ? row : null
  }
  const onLeave = () => {
    for (const card of cards.values()) card.hoverRow = null
  }

  let alive = true
  const loop = createLoop(root, tick, () => true)
  const start = () => alive && loop.start()

  collect() // the marquee's first layout event may have fired before this listener
  root.addEventListener('marquee:layout', collect)
  for (const row of rows) {
    row.addEventListener('pointermove', onMove)
    row.addEventListener('pointerleave', onLeave)
  }
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })

  return () => {
    alive = false
    loop.stop()
    observer.disconnect()
    window.removeEventListener('load', start)
    root.removeEventListener('marquee:layout', collect)
    for (const row of rows) {
      row.removeEventListener('pointermove', onMove)
      row.removeEventListener('pointerleave', onLeave)
    }
    for (const canvas of owner.keys()) canvas.getContext('2d')?.clearRect(0, 0, SIZE, SIZE)
    root.querySelectorAll(`[${LIVE}]`).forEach((el) => el.removeAttribute(LIVE))
  }
}

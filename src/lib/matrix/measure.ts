import { coversHero } from './coverage'
import { NAME } from './intro'
import { lineRects, type Rect } from './mask'

/** Fallback pitch when the name anchor is missing: phones, then wider screens. */
const FALLBACK_PITCH = [22, 40] as const
const MOBILE_BREAKPOINT = 768

/** Where the grid goes, read from the page. Every value is in the canvas's CSS pixels. */
export interface Layout {
  width: number
  height: number
  pitch: number
  /** Top-left corner of the name block (0, 0 without an anchor). */
  ax: number
  ay: number
  named: boolean
  /** Boxes of the hero copy the glow must stay out of: text lines and buttons. */
  copy: Rect[]
  /** Bottom edge of the hero buttons, where the bottom fade starts; null without buttons. */
  buttonBottom: number | null
  /** Bottom edge of the fixed nav over the hero, where the top fade ends; null without a marker. */
  navBottom: number | null
  /** Changes whenever any of the above does. */
  key: string
}

/**
 * Reads the layout from the canvas, the static name (`anchor`, whose width is
 * 23 pitches), the copy elements and the `[data-matrix-nav]` element in
 * `frame`, whose top padding clears the nav: its content edge is the nav's
 * bottom, read without the nav itself so scrolling never changes it. Null while the canvas isn't laid out,
 * or when it doesn't cover the hero (`frame`; see coversHero).
 */
export function measure(
  frame: Element,
  canvas: HTMLCanvasElement,
  anchor: Element | null,
  copy: readonly Element[],
): Layout | null {
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null // not laid out yet, or hidden
  if (!coversHero(frame.getBoundingClientRect(), rect)) return null
  const box = anchor?.getBoundingClientRect()
  const named = !!box && box.width > 0 && box.height > 0
  const pitch = named ? box.width / NAME.cols : FALLBACK_PITCH[rect.width < MOBILE_BREAKPOINT ? 0 : 1]
  const ax = named ? box.left - rect.left : 0
  const ay = named ? box.top - rect.top : 0
  const local = (b: DOMRect): Rect => ({ left: b.left - rect.left, top: b.top - rect.top, right: b.right - rect.left, bottom: b.bottom - rect.top })
  let buttonBottom: number | null = null
  const boxes = copy.flatMap((el) => {
    // A row of links or buttons masks each one; text masks the ink of each line.
    const controls = [...el.querySelectorAll('a, button')]
    if (controls.length) {
      const rects = controls.map((c) => local(c.getBoundingClientRect())).filter((b) => b.bottom > b.top)
      for (const b of rects) buttonBottom = Math.max(buttonBottom ?? -Infinity, b.bottom)
      return rects
    }
    const range = document.createRange()
    range.selectNodeContents(el)
    return lineRects([...range.getClientRects()].map(local))
  })
  const pad = frame.querySelector('[data-matrix-nav]')
  const navBottom = pad ? pad.getBoundingClientRect().top - rect.top + parseFloat(getComputedStyle(pad).paddingTop) : null
  const values = [rect.width, rect.height, pitch, ax, ay, navBottom ?? -1, ...boxes.flatMap((b) => [b.left, b.top, b.right, b.bottom])]
  return {
    width: rect.width,
    height: rect.height,
    pitch,
    ax,
    ay,
    named,
    copy: boxes,
    buttonBottom,
    navBottom,
    key: values.map((v) => v.toFixed(2)).join(),
  }
}

import { bleedOffset } from './bleed'
import { NAME } from './intro'
import { lineRects, type Rect } from './mask'

/** Fallback pitch when the name anchor is missing: phones, then wider screens. */
const FALLBACK_PITCH = [22, 40] as const
const MOBILE_BREAKPOINT = 768

/**
 * Where the grid goes, read from the page. Every value is in the hero's CSS
 * pixels (y = 0 at its top edge); the canvas starts `top` px above it.
 */
export interface Layout {
  width: number
  height: number
  /** The bleed: how far the canvas reaches above the hero. */
  top: number
  pitch: number
  /** Top-left corner of the name block (0, 0 without an anchor). */
  ax: number
  ay: number
  named: boolean
  /** Boxes of the hero copy the glow must stay out of: text lines and buttons. */
  copy: Rect[]
  /** Bottom edge of the hero buttons, where the bottom fade starts; null without buttons. */
  buttonBottom: number | null
  /** Changes whenever any of the above does. */
  key: string
}

/**
 * Reads the layout from the hero (`frame`), the canvas, the static name
 * (`anchor`, whose width is 23 pitches) and the copy elements. Null while the
 * canvas isn't laid out.
 */
export function measure(
  frame: Element,
  canvas: HTMLCanvasElement,
  anchor: Element | null,
  copy: readonly Element[],
): Layout | null {
  const rect = frame.getBoundingClientRect()
  const area = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0 || area.width === 0) return null // not laid out yet, or hidden
  const top = bleedOffset(rect.top, area.top)
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
  const values = [rect.width, rect.height, top, pitch, ax, ay, ...boxes.flatMap((b) => [b.left, b.top, b.right, b.bottom])]
  return {
    width: rect.width,
    height: rect.height,
    top,
    pitch,
    ax,
    ay,
    named,
    copy: boxes,
    buttonBottom,
    key: values.map((v) => v.toFixed(2)).join(),
  }
}

import { parseHex } from './color'
import type { Palette } from './renderer'

/** Reads the matrix colors from the design tokens. Throws if a token is unreadable. */
export function readPalette(el: Element): Palette {
  const style = getComputedStyle(el)
  const token = (name: string) => parseHex(style.getPropertyValue(name))
  return {
    line: token('--color-line'),
    accent: token('--color-accent'),
    accent2: token('--color-accent-2'),
  }
}

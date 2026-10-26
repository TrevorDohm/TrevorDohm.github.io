import { clamp01, hash2 } from './math'

export const NAME_LINES = ['TREVOR', 'DOHM'] as const
export const LINE_GAP = 1
export const TIMELINE = { form: 0.9, hold: 1.6, break: 1.4, fade: 0.5, ghost: 0.3 } as const
export const DISSOLVE_BAND = 0.22

const GLYPH_ROWS = 5
const HOLD_WEIGHT = 0.95
const RAMP = 0.35

/** 3x5 pixel font (M is 5 wide). */
export const GLYPHS: Record<string, readonly string[]> = {
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
}

const wordWidth = (w: string) => [...w].reduce((s, ch) => s + GLYPHS[ch][0].length, 0) + w.length - 1

/** Lit cells of the name block as [row, col], lines left-aligned, one empty column between letters. */
export function nameMask(lines: readonly string[], lineGap: number) {
  const cells: Array<[row: number, col: number]> = []
  lines.forEach((word, li) => {
    const top = li * (GLYPH_ROWS + lineGap)
    let left = 0
    for (const ch of word) {
      const g = GLYPHS[ch]
      g.forEach((line, r) => {
        for (let c = 0; c < line.length; c++) if (line[c] === '#') cells.push([top + r, left + c])
      })
      left += g[0].length + 1
    }
  })
  return {
    cols: Math.max(...lines.map(wordWidth)),
    rows: lines.length * GLYPH_ROWS + (lines.length - 1) * lineGap,
    cells,
  }
}

/** Weight of a name cell at time t: sweep in, hold, release at a seeded moment, settle to a ghost. */
export function nameWeight(t: number, col: number, row: number, nameCols: number, attention: number): number {
  const { form, hold, break: brk, fade, ghost } = TIMELINE
  const delay = (col / nameCols) * 0.6 * form
  const on = clamp01((t - delay) / RAMP)
  const release = form + hold + hash2(row, col) * brk
  const held = t < release ? 1 : clamp01(1 - (t - release) / fade)
  const resting = Math.max(ghost + 0.75 * attention, attention)
  return Math.max(on * (held * HOLD_WEIGHT + (1 - held) * resting), attention * 0.9)
}

/** Visibility of a grid cell near the bottom edge: 1 above the band, a seeded dissolve inside it. */
export function bottomFade(row: number, rows: number, col: number): number {
  const fromBottom = (rows - 1 - row) / rows
  if (fromBottom >= DISSOLVE_BAND) return 1
  return clamp01((fromBottom / DISSOLVE_BAND) * 1.6 - hash2(col, row) * 0.6)
}

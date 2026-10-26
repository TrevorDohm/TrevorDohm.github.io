import { clamp01, hash2 } from './math'

export const NAME_LINES = ['TREVOR', 'DOHM'] as const
export const LINE_GAP = 1
export const TIMELINE = { form: 0.9, hold: 1.6, break: 1.4, fade: 0.5, ghost: 0.3 } as const
/**
 * Share of rows, from the bottom, that darken into the ribbon. NameMark.astro's
 * height cap (its 0.2 and 4.6 constants) assumes the band's top at 0.65 of the
 * hero; change both together.
 */
export const DISSOLVE_BAND = 0.35

const GLYPH_ROWS = 5
const HOLD_WEIGHT = 0.95
const RAMP = 0.35
/** What the band's last row keeps, before the jitter and dropouts. */
const FADE_FLOOR = 0.18
/** Per-cell brightness jitter in the band, as a share either way. */
const JITTER = 0.12
/** Chance of a full dropout for an eligible cell on the last row; 0 in the band's top third. */
const DROP_PEAK = 0.75

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

/**
 * Visibility of a grid cell near the bottom edge: 1 above the band; inside it
 * an eased darkening (steeper toward the bottom) from 1 to FADE_FLOOR on the
 * last row, times a seeded per-cell jitter. A few cells drop out fully, more
 * toward the bottom and none in the band's top third. Only cells on a sparse
 * lattice ((col + 2 row) mod 5 = 0, a fifth of them) may drop, and no two of
 * those touch, so the dropouts never join into holes.
 */
export function bottomFade(row: number, rows: number, col: number): number {
  const fromBottom = (rows - 1 - row) / rows
  if (fromBottom >= DISSOLVE_BAND) return 1
  const depth = fromBottom / DISSOLVE_BAND // 1 at the band's top, 0 on the last row
  const eligible = (((col + 2 * row) % 5) + 5) % 5 === 0
  const dropChance = DROP_PEAK * Math.max(0, 1 - depth * 1.5) // 0 from two thirds up
  if (eligible && hash2(row, col) < dropChance) return 0
  const eased = depth * (1.4 - 0.4 * depth) // steeper toward the bottom, never flat
  const base = FADE_FLOOR + (1 - FADE_FLOOR) * eased
  return clamp01(base * (1 + JITTER * (2 * hash2(col, row) - 1)))
}

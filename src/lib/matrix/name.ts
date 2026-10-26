import { clamp01, hash2 } from './math'

export const NAME_LINES = ['TREVOR', 'DOHM'] as const
export const LINE_GAP = 1
export const TIMELINE = { form: 0.9, hold: 1.6, break: 1.4, fade: 0.5, ghost: 0.3 } as const
/**
 * Share of rows, from the bottom, that fade into the page. Its top (0.55 of the
 * hero) sits above the name's lower rows on short screens; that is fine, the
 * name is exempt and the band's top rows are still nearly full. NameMark.astro's
 * height cap keeps the name's bottom at 0.65 of the hero (its 0.2 and 4.6
 * constants), and idle.ts keeps the drift above this band's top.
 */
export const DISSOLVE_BAND = 0.45
const GLYPH_ROWS = 5
const HOLD_WEIGHT = 0.95
const RAMP = 0.35
/** Per-cell brightness jitter at the band's top, as a share either way; it shrinks to 0 at the bottom. */
const JITTER = 0.1
/** Share of cells removed on the band's last rows; none in its top fifth. */
const DROP_MAX = 0.55
/** Where removal starts, as a share of the band from its top. */
const DROP_START = 0.2
/** The R2 sequence's steps (1/g and 1/g^2, g the plastic number): an ordered dither. */
const R2_COL = 0.7548776662
const R2_ROW = 0.5698402910

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
 * an eased fade from 1 at the band's top to about 0 on the last row (half
 * linear, half smoothstep: it stays bright longer at the top and settles
 * gently at the bottom), times a seeded per-cell jitter that shrinks toward
 * the bottom. Cells are also removed, more with depth: none in the band's top
 * fifth, rising on a smoothstep to DROP_MAX on the last rows, so the edge
 * tapers away. Which cells go is an ordered dither, the R2 sequence (plus a
 * little seeded noise): every row gets its share evenly, and any 2x2 block's
 * four thresholds spread over at least 0.675 of [0, 1), so at DROP_MAX 0.55 no
 * block is ever fully removed and no black holes form.
 */
export function bottomFade(row: number, rows: number, col: number): number {
  const fromBottom = (rows - 1 - row) / rows
  if (fromBottom >= DISSOLVE_BAND) return 1
  // 1 at the band's top, near 0 on the last row (measured at the cell's centre).
  const depth = Math.min(1, (fromBottom + 0.5 / rows) / DISSOLVE_BAND)
  const ramp = Math.max(0, (1 - depth - DROP_START) / (1 - DROP_START))
  const dropChance = DROP_MAX * ramp * ramp * (3 - 2 * ramp)
  const dither = (R2_COL * col + R2_ROW * row + 0.04 * (hash2(row + 7, col) - 0.5)) % 1
  if (dither < dropChance) return 0
  const eased = 0.5 * depth + 0.5 * depth * depth * (3 - 2 * depth)
  return clamp01(eased * (1 + JITTER * depth * (2 * hash2(col, row) - 1)))
}

/**
 * The hero's fades. Pure. From the buttons' bottom edge down each cell dims
 * toward the bottom (`bottomFade`), and from the first row wholly below the
 * buttons some cells are removed outright, more the lower they are
 * (`dropoutMap`), so the grid tapers into the page with no edge. The top
 * mirrors it (`topFade`) under the nav, up to the hero's top edge, so a
 * pull-down reveals an already faded grid; below the nav every row is at
 * full strength.
 */
import type { Grid } from './geometry'
import { clamp01, hash2 } from './math'

/**
 * The fallback band, as a share of rows from the bottom, when the buttons
 * can't be measured: its top sits at 0.55 of the hero.
 */
export const DISSOLVE_BAND = 0.45
/** Per-cell brightness jitter where the dimming starts, as a share either way; it shrinks to 0 at the bottom. */
const JITTER = 0.1
/**
 * Removal chance on the first row below the buttons and on the last row,
 * before the no-clump rule turns some removals down; what is actually removed
 * is about 0.22 and 0.67.
 */
const DROP_FIRST = 0.23
const DROP_LAST = 0.9
/** The top band's removal chances, lighter than the bottom's: it is short and mostly hidden by the nav. */
const TOP_DROP_FIRST = 0.12
const TOP_DROP_LAST = 0.5
/** Fewest rows the top fade spans under a short nav (a wide screen's), so a pull-down still meets a taper. */
const MIN_TOP_ROWS = 3

/**
 * Where the fades are: at the bottom, the dimming's first row, the removals'
 * first row and the idle path's floor (px); at the top, the first row at full
 * strength (rows above it dim), the end of the removals (rows above
 * `dropEnd`) and the idle path's ceiling (px).
 */
export interface FadeRows {
  dimStart: number
  dropStart: number
  floor: number
  full: number
  dropEnd: number
  ceiling: number
}

/**
 * The fades' rows on `grid`. The dimming starts on the row holding the
 * buttons' bottom edge (`buttonBottom`, canvas px; an edge on a row line
 * belongs to the row above), and the removals on the row below; without it,
 * the fallback band. The top fade reaches full strength on the first row
 * wholly below the nav (`navBottom`), at least MIN_TOP_ROWS down and never
 * past the row above the name (`nameTop`, on a row line); without a nav, at
 * that row; without either, as deep as the bottom fade. It stays at least
 * one row deep and clear of the bottom fade. The idle path's floor keeps a
 * row above the dimming; its ceiling is halfway down the top fade.
 */
export function fadeRows(
  grid: Grid,
  buttonBottom: number | null,
  nameTop: number | null = null,
  navBottom: number | null = null,
): FadeRows {
  const { rows, pitch, originY } = grid
  let dimStart: number
  let dropStart: number
  if (buttonBottom !== null && Number.isFinite(buttonBottom)) {
    dimStart = Math.min(rows - 2, Math.max(0, Math.ceil((buttonBottom - originY) / pitch) - 1))
    dropStart = dimStart + 1
  } else {
    dimStart = Math.floor(rows - 1 - DISSOLVE_BAND * rows) + 1
    dropStart = dimStart + Math.ceil((rows - dimStart) / 5)
  }
  const named = nameTop !== null && Number.isFinite(nameTop)
  const aboveName = named ? Math.round((nameTop - originY) / pitch) - 1 : rows - 1 - dimStart
  const underNav = navBottom !== null && Number.isFinite(navBottom)
  const navRow = underNav ? Math.max(MIN_TOP_ROWS, Math.ceil((navBottom - originY) / pitch)) : Infinity
  const wanted = Math.min(aboveName, navRow)
  const full = Math.max(1, Math.min(dimStart - 1, wanted))
  return {
    dimStart,
    dropStart,
    floor: originY + (dimStart - 1) * pitch,
    full,
    dropEnd: full,
    ceiling: originY + (full / 2) * pitch,
  }
}

/**
 * Visibility of a grid cell near the bottom edge: 1 above and on `dimStart`; from
 * the next row, an eased fade from 1 to 0 on the last row, however few rows that is (half linear, half
 * smoothstep: it stays bright longer at the top and settles gently at the
 * bottom), times a seeded per-cell jitter that shrinks toward the bottom, so
 * the last rows are uniformly near 0.
 */
export function bottomFade(row: number, rows: number, col: number, dimStart: number): number {
  if (row < dimStart) return 1
  const depth = (rows - 1 - row) / Math.max(1, rows - 1 - dimStart) // 1 at the start, 0 on the last row
  const eased = 0.5 * depth + 0.5 * depth * depth * (3 - 2 * depth)
  if (row === dimStart) return 1 // beside the buttons: full brightness, no jitter
  return clamp01(eased * (1 + JITTER * depth * (2 * hash2(col, row) - 1)))
}

/**
 * Visibility of a grid cell near the top edge, `bottomFade` upside down: 1 on
 * and below `full`; above it, an eased rise from 0 on the top row to 1 at
 * `full`, times the same seeded jitter, which shrinks toward the top.
 */
export function topFade(row: number, col: number, full: number): number {
  if (row >= full) return 1
  const depth = row / Math.max(1, full) // 0 on the top row, 1 at the full row
  const eased = 0.5 * depth + 0.5 * depth * depth * (3 - 2 * depth)
  return clamp01(eased * (1 + JITTER * depth * (2 * hash2(col, row) - 1)))
}

/** Chance that a cell on `row` is removed: 0 above `dropStart`, then DROP_FIRST rising on a smoothstep to DROP_LAST. */
export function dropChance(row: number, rows: number, dropStart: number): number {
  if (row < dropStart) return 0
  const ramp = Math.min(1, (row - dropStart) / Math.max(1, rows - 1 - dropStart))
  return DROP_FIRST + (DROP_LAST - DROP_FIRST) * ramp * ramp * (3 - 2 * ramp)
}

/** `dropChance` upside down and lighter: 0 from `dropEnd` down, TOP_DROP_FIRST on the row above it, TOP_DROP_LAST on the top row. */
export function topDropChance(row: number, dropEnd: number): number {
  if (row >= dropEnd) return 0
  const ramp = Math.min(1, (dropEnd - 1 - row) / Math.max(1, dropEnd - 1))
  return TOP_DROP_FIRST + (TOP_DROP_LAST - TOP_DROP_FIRST) * ramp * ramp * (3 - 2 * ramp)
}

/**
 * Which cells of a cols x rows grid are removed (1). Each cell draws its own
 * seeded random threshold against `dropChance` (and `topDropChance` above
 * `dropEnd`, 0 for no top band), so the scatter looks random.
 * Scanning row by row, left to right, a removal that would complete a fully
 * removed 2x2 block with the cells up, left and up-left is skipped, so the
 * removals never clump into black holes. Computed once per layout.
 */
export function dropoutMap(cols: number, rows: number, dropStart: number, dropEnd = 0): Uint8Array {
  const drop = new Uint8Array(cols * rows)
  for (let row = 0; row < rows; row++) {
    const chance = Math.max(dropChance(row, rows, dropStart), topDropChance(row, dropEnd))
    if (chance <= 0) continue
    for (let col = 0; col < cols; col++) {
      if (hash2(row + 7, col) >= chance) continue
      const i = row * cols + col
      if (row > 0 && col > 0 && drop[i - 1] && drop[i - cols] && drop[i - cols - 1]) continue
      drop[i] = 1
    }
  }
  return drop
}

/**
 * The hero's bottom fade. Pure. Inside the band each cell dims toward the
 * bottom (`bottomFade`), and some cells are removed outright, more the lower
 * they are (`dropoutMap`), so the grid tapers into the page with no edge.
 */
import { clamp01, hash2 } from './math'

/**
 * Share of rows, from the bottom, that fade into the page. Its top (0.55 of the
 * hero) sits above the name's lower rows on short screens; that is fine, the
 * name is exempt and the band's top rows are still nearly full. NameMark.astro's
 * height cap keeps the name's bottom at 0.65 of the hero (its 0.2 and 4.6
 * constants), and idle.ts keeps the drift above this band's top.
 */
export const DISSOLVE_BAND = 0.45
/** Per-cell brightness jitter at the band's top, as a share either way; it shrinks to 0 at the bottom. */
const JITTER = 0.1
/**
 * Removal chance on the band's last rows, before the no-clump rule turns some
 * removals down; what is actually removed there is about 0.55.
 */
const DROP_MAX = 0.66
/** Where removal starts, as a share of the band from its top. */
const DROP_START = 0.2

/** How deep a row sits in the band: 1 at its top, near 0 on the last row (at the cell's centre); null above it. */
function bandDepth(row: number, rows: number): number | null {
  const fromBottom = (rows - 1 - row) / rows
  if (fromBottom >= DISSOLVE_BAND) return null
  return Math.min(1, (fromBottom + 0.5 / rows) / DISSOLVE_BAND)
}

/**
 * Visibility of a grid cell near the bottom edge: 1 above the band; inside it
 * an eased fade from 1 at the band's top to about 0 on the last row (half
 * linear, half smoothstep: it stays bright longer at the top and settles
 * gently at the bottom), times a seeded per-cell jitter that shrinks toward
 * the bottom, so the last rows are uniformly near 0.
 */
export function bottomFade(row: number, rows: number, col: number): number {
  const depth = bandDepth(row, rows)
  if (depth === null) return 1
  const eased = 0.5 * depth + 0.5 * depth * depth * (3 - 2 * depth)
  return clamp01(eased * (1 + JITTER * depth * (2 * hash2(col, row) - 1)))
}

/** Chance that a cell on `row` is removed: 0 in the band's top fifth, then a smoothstep up to DROP_MAX. */
export function dropChance(row: number, rows: number): number {
  const depth = bandDepth(row, rows)
  if (depth === null) return 0
  const ramp = Math.max(0, (1 - depth - DROP_START) / (1 - DROP_START))
  return DROP_MAX * ramp * ramp * (3 - 2 * ramp)
}

/**
 * Which cells of a cols x rows grid are removed (1). Each cell draws its own
 * seeded random threshold against `dropChance`, so the scatter looks random.
 * Scanning row by row, left to right, a removal that would complete a fully
 * removed 2x2 block with the cells up, left and up-left is skipped, so the
 * removals never clump into black holes. Computed once per layout.
 */
export function dropoutMap(cols: number, rows: number): Uint8Array {
  const drop = new Uint8Array(cols * rows)
  for (let row = 0; row < rows; row++) {
    const chance = dropChance(row, rows)
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

import { describe, expect, it } from 'vitest'
import { dropoutMap, fadeRows, topFade } from './dissolve'
import { layoutGrid } from './geometry'

// Same shape as dissolve.test.ts: 90 rows, the bottom removals from row 52.
const ROWS = 90
const COLS = 400
const DROP = 52
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

// The top fade mirrors the bottom one: dimming over rows [0, FULL), removals on rows < FULL.
const FULL = 30
const topRowsList = Array.from({ length: FULL }, (_, k) => k)

describe('topFade (the dimming at the top)', () => {
  const row = (r: number) => Array.from({ length: COLS }, (_, c) => topFade(r, c, FULL))
  const means = topRowsList.map((r) => mean(row(r)))

  it('is exactly 1 on and below its full row, and in [0, 1] above it', () => {
    for (let r = FULL; r < ROWS; r++) expect(row(r).every((f) => f === 1)).toBe(true)
    for (const r of topRowsList) for (const f of row(r)) expect(f >= 0 && f <= 1).toBe(true)
  })

  it('rises continuously from the top row: row means grow every row, never by more than 0.06 at once', () => {
    for (let k = 1; k < means.length; k++) {
      expect(means[k]).toBeGreaterThan(means[k - 1])
      expect(means[k] - means[k - 1]).toBeLessThanOrEqual(0.06)
    }
    expect(1 - means[means.length - 1]).toBeLessThanOrEqual(0.06)
  })

  it('is 0 on the top row, so the hero meets the page with no edge', () => {
    expect(Math.max(...row(0))).toBe(0)
    expect(Math.max(...row(1))).toBeLessThanOrEqual(0.12)
  })

  it('finishes on the top row however few rows it spans', () => {
    for (const span of [2, 3, 5]) {
      expect(Math.max(...Array.from({ length: COLS }, (_, c) => topFade(0, c, span)))).toBe(0)
      expect(Math.min(...Array.from({ length: COLS }, (_, c) => topFade(span, c, span)))).toBe(1)
    }
  })

  it('varies from cell to cell near its full row (a jitter, not a flat gradient)', () => {
    const r = row(FULL - 5)
    expect(Math.max(...r) - Math.min(...r)).toBeGreaterThan(0.08)
  })
})

describe('dropoutMap with a top band', () => {
  const drop = dropoutMap(COLS, ROWS, DROP, FULL)
  const off = (r: number, c: number) => drop[r * COLS + c] === 1
  const share = (r: number) => mean(Array.from({ length: COLS }, (_, c) => (off(r, c) ? 1 : 0)))

  it('removes nothing between the bands, and the bottom band as before', () => {
    for (let r = FULL; r < DROP; r++) expect(share(r)).toBe(0)
    const bottomOnly = dropoutMap(COLS, ROWS, DROP)
    for (let i = (FULL + 1) * COLS; i < drop.length; i++) expect(drop[i]).toBe(bottomOnly[i])
  })

  it('starts with about a fifth of the row next to the full row and rises to about two thirds at the top', () => {
    expect(share(FULL - 1)).toBeGreaterThanOrEqual(0.15)
    expect(share(FULL - 1)).toBeLessThanOrEqual(0.3)
    const top3 = mean([0, 1, 2].map(share))
    expect(top3).toBeGreaterThanOrEqual(0.6)
    // A little denser than the bottom's last rows: the top row has no row above it to complete a
    // 2x2 block, so the no-clump rule turns fewer removals down there.
    expect(top3).toBeLessThanOrEqual(0.8)
    const blocks = Array.from({ length: Math.floor(FULL / 5) }, (_, b) => mean([0, 1, 2, 3, 4].map((k) => share(b * 5 + k))))
    for (let b = 1; b < blocks.length; b++) expect(blocks[b]).toBeLessThanOrEqual(blocks[b - 1] + 0.03)
  })

  it('never clumps and never repeats with a short period', () => {
    for (let r = 0; r + 1 < FULL; r++)
      for (let c = 0; c + 1 < COLS; c++) expect(off(r, c) && off(r, c + 1) && off(r + 1, c) && off(r + 1, c + 1)).toBe(false)
    for (const r of topRowsList.filter((r) => share(r) >= 0.1)) {
      for (let k = 1; k <= 4; k++) expect(Array.from({ length: COLS - k }, (_, c) => off(r, c) === off(r, c + k)).every(Boolean)).toBe(false)
    }
  })

  it('removes nothing at the top with no top band', () => {
    const none = dropoutMap(COLS, ROWS, DROP, 0)
    for (let r = 0; r < DROP; r++) for (let c = 0; c < COLS; c++) expect(none[r * COLS + c]).toBe(0)
  })
})

describe('fadeRows at the top', () => {
  const grid = layoutGrid(390, 844, 14, 24, 284) // originY = -10

  it('reaches full strength on the row just above the name, with removals above that', () => {
    const rows = fadeRows(grid, 559, 284)
    const nameRow = Math.round((284 - grid.originY) / grid.pitch)
    expect(rows.full).toBe(nameRow - 1)
    expect(rows.dropEnd).toBe(rows.full)
    // The idle path's ceiling: one row of margin below the full row (the floor's mirror).
    expect(rows.ceiling).toBeCloseTo(grid.originY + (rows.full + 2) * grid.pitch)
    expect(rows.ceiling).toBeLessThan(rows.floor)
  })

  it('without a name, spans as many rows as the bottom fade', () => {
    const rows = fadeRows(grid, 559)
    expect(rows.full).toBe(grid.rows - 1 - rows.dimStart)
  })

  it('stays clear of the bottom fade on a short grid', () => {
    const short = layoutGrid(390, 300, 14, 24, 250)
    const rows = fadeRows(short, 290, 250)
    expect(rows.full).toBeGreaterThanOrEqual(1)
    expect(rows.full).toBeLessThan(rows.dimStart)
  })
})

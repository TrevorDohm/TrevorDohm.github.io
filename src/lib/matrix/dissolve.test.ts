import { describe, expect, it } from 'vitest'
import { bottomFade, DISSOLVE_BAND, dropoutMap, fadeRows } from './dissolve'
import { layoutGrid } from './geometry'

// A tall grid: 90 rows, the dimming from row 50 and the removals from row 52.
const ROWS = 90
const COLS = 400
const DIM = 50
const DROP = 52
const fadeRowsList = Array.from({ length: ROWS - DIM }, (_, k) => DIM + k)
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

describe('bottomFade (the dimming)', () => {
  const row = (r: number) => Array.from({ length: COLS }, (_, c) => bottomFade(r, ROWS, c, DIM))
  const means = fadeRowsList.map((r) => mean(row(r)))

  it('is 1 above its start row, about 1 on it, and in [0, 1] below it', () => {
    for (let r = 0; r < DIM; r++) expect(row(r).every((f) => f === 1)).toBe(true)
    expect(Math.min(...row(DIM))).toBeGreaterThanOrEqual(0.9)
    for (const r of fadeRowsList) for (const f of row(r)) expect(f >= 0 && f <= 1).toBe(true)
  })

  it('dims continuously: row means fall every row, never by more than 0.05 at once', () => {
    let prev = 1
    for (const m of means) {
      expect(m).toBeLessThan(prev)
      expect(prev - m).toBeLessThanOrEqual(0.05)
      prev = m
    }
  })

  it('reaches 0 on the last row, so the hero has no visible edge', () => {
    expect(means[means.length - 1]).toBeLessThanOrEqual(0.03)
    for (const r of fadeRowsList.slice(-3)) expect(Math.max(...row(r))).toBeLessThanOrEqual(0.12)
    // The jitter has shrunk away there: the second-to-last row varies by under 10% of its mean.
    const near = row(ROWS - 2)
    expect((Math.max(...near) - Math.min(...near)) / mean(near)).toBeLessThan(0.1)
  })

  it('finishes on the last row however few rows it spans (a short screen)', () => {
    for (const span of [3, 5, 8]) {
      const last = Array.from({ length: COLS }, (_, c) => bottomFade(ROWS - 1, ROWS, c, ROWS - span))
      expect(Math.max(...last)).toBeLessThanOrEqual(0.03)
      expect(Math.min(...Array.from({ length: COLS }, (_, c) => bottomFade(ROWS - span, ROWS, c, ROWS - span)))).toBeGreaterThanOrEqual(0.9)
    }
  })

  it('varies from cell to cell near its top (a jitter, not a flat gradient)', () => {
    const r = row(DIM + 5)
    expect(Math.max(...r) - Math.min(...r)).toBeGreaterThan(0.08)
  })
})

describe('dropoutMap (the removed cells)', () => {
  const drop = dropoutMap(COLS, ROWS, DROP)
  const off = (r: number, c: number) => drop[r * COLS + c] === 1
  const share = (r: number) => mean(Array.from({ length: COLS }, (_, c) => (off(r, c) ? 1 : 0)))
  const dropRows = Array.from({ length: ROWS - DROP }, (_, k) => DROP + k)

  it('removes nothing above its start row', () => {
    for (let r = 0; r < DROP; r++) expect(share(r)).toBe(0)
  })

  it('starts with a fifth of the first row removed and rises to about two thirds on the last rows', () => {
    const shares = dropRows.map(share)
    // Random per cell, so single rows are noisy (±0.025 at this width, and a dense row makes the
    // no-clump rule turn down more in the next); blocks of 4 rows rise.
    for (let k = 1; k < shares.length; k++) expect(shares[k]).toBeGreaterThanOrEqual(shares[k - 1] - 0.1)
    const blocks = Array.from({ length: Math.floor(shares.length / 4) }, (_, b) => mean(shares.slice(-4 * (b + 1), shares.length - 4 * b))).reverse()
    for (let b = 1; b < blocks.length; b++) expect(blocks[b]).toBeGreaterThanOrEqual(blocks[b - 1] - 0.03)
    expect(blocks[blocks.length - 1] - blocks[0]).toBeGreaterThan(0.3)
    expect(shares[0]).toBeGreaterThanOrEqual(0.15)
    expect(shares[0]).toBeLessThanOrEqual(0.3)
    expect(mean(shares.slice(-3))).toBeGreaterThanOrEqual(0.6)
    expect(mean(shares.slice(-3))).toBeLessThanOrEqual(0.75)
  })

  it('never clumps: no 2x2 block of cells is fully removed', () => {
    for (let r = 0; r + 1 < ROWS; r++)
      for (let c = 0; c + 1 < COLS; c++) expect(off(r, c) && off(r, c + 1) && off(r + 1, c) && off(r + 1, c + 1)).toBe(false)
  })

  it('looks random: removals at 1 to 4 cells apart co-occur about as often as chance', () => {
    // Over the bottom third of the removal rows, where most cells go. A
    // dither or any periodic pattern pushes some of these ratios far from 1.
    const rows = dropRows.slice(-Math.floor(dropRows.length / 3))
    const p = mean(rows.map(share))
    for (let lag = 1; lag <= 4; lag++) {
      let h = 0
      let v = 0
      let n = 0
      for (const r of rows.slice(0, -lag)) {
        for (let c = 0; c + lag < COLS; c++) {
          h += off(r, c) && off(r, c + lag) ? 1 : 0
          v += off(r, c) && off(r + lag, c) ? 1 : 0
          n++
        }
      }
      for (const both of [h, v]) {
        expect(both / n / (p * p)).toBeGreaterThan(0.7)
        expect(both / n / (p * p)).toBeLessThan(1.3)
      }
    }
  })

  it('looks random: no row of removals repeats with a period of 4 or less', () => {
    for (const r of dropRows.filter((r) => share(r) >= 0.1)) {
      for (let k = 1; k <= 4; k++) {
        const repeats = Array.from({ length: COLS - k }, (_, c) => off(r, c) === off(r, c + k)).every(Boolean)
        expect(repeats).toBe(false)
      }
    }
  })
})

describe('fadeRows', () => {
  const grid = layoutGrid(1440, 900, 32, 240, 207)

  it('starts the dimming on the row holding the bottom edge of the buttons and the removals on the row below', () => {
    const bottom = 678
    const rows = fadeRows(grid, bottom)
    const buttonRow = Math.floor((bottom - grid.originY) / grid.pitch)
    expect(rows.dimStart).toBe(buttonRow)
    expect(rows.dropStart).toBe(buttonRow + 1)
    // The idle path's floor: one row of margin above the dimming.
    expect(rows.floor).toBeCloseTo(grid.originY + (buttonRow - 1) * grid.pitch)
  })

  it('counts an edge exactly on a row line as the row above it', () => {
    const bottom = grid.originY + 20 * grid.pitch
    expect(fadeRows(grid, bottom).dimStart).toBe(19)
  })

  it('falls back to the band (top at 0.55 of the height) without a button row', () => {
    for (const top of [null, Number.NaN]) {
      const rows = fadeRows(grid, top)
      const first = Array.from({ length: grid.rows }, (_, r) => r).find((r) => (grid.rows - 1 - r) / grid.rows < DISSOLVE_BAND)
      expect(rows.dimStart).toBe(first)
      expect(rows.dropStart).toBe(first! + Math.ceil((grid.rows - first!) / 5))
    }
  })

  it('keeps the rows inside the grid for a button row off either end', () => {
    for (const top of [-500, 5000]) {
      const rows = fadeRows(grid, top)
      expect(rows.dimStart).toBeGreaterThanOrEqual(0)
      expect(rows.dropStart).toBeLessThanOrEqual(grid.rows - 1)
      expect(rows.dimStart).toBeLessThan(rows.dropStart)
    }
  })
})

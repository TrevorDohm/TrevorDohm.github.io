import { describe, expect, it } from 'vitest'
import { bottomFade, DISSOLVE_BAND, dropoutMap } from './dissolve'

// A tall grid: 90 rows, so the band has about 40 rows.
const ROWS = 90
const COLS = 400
const inBand = (r: number) => (ROWS - 1 - r) / ROWS < DISSOLVE_BAND
const bandRows = Array.from({ length: ROWS }, (_, r) => r).filter(inBand)
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

describe('bottomFade (the dimming)', () => {
  const row = (r: number) => Array.from({ length: COLS }, (_, c) => bottomFade(r, ROWS, c))
  const means = bandRows.map((r) => mean(row(r)))

  it('covers the lowest 40 to 50% of rows and is 1 above it', () => {
    expect(DISSOLVE_BAND).toBeGreaterThanOrEqual(0.4)
    expect(DISSOLVE_BAND).toBeLessThanOrEqual(0.5)
    for (let r = 0; r < ROWS; r++) if (!inBand(r)) expect(row(r).every((f) => f === 1)).toBe(true)
    for (const r of bandRows) for (const f of row(r)) expect(f > 0 && f <= 1).toBe(true)
  })

  it('dims continuously: row means fall every row, never by more than 0.05 at once', () => {
    let prev = 1
    for (const m of means) {
      expect(m).toBeLessThan(prev)
      expect(prev - m).toBeLessThanOrEqual(0.05)
      prev = m
    }
  })

  it('reaches about 0 at the bottom, so the hero has no visible edge', () => {
    expect(means[means.length - 1]).toBeLessThanOrEqual(0.03)
    for (const r of bandRows.slice(-3)) expect(Math.max(...row(r))).toBeLessThanOrEqual(0.12)
    // The jitter has shrunk away there: the last row varies by under 5% of its mean.
    const last = row(bandRows[bandRows.length - 1])
    expect((Math.max(...last) - Math.min(...last)) / mean(last)).toBeLessThan(0.05)
  })

  it('varies from cell to cell in the upper band (a jitter, not a flat gradient)', () => {
    const r = row(bandRows[Math.floor(bandRows.length / 3)])
    expect(Math.max(...r) - Math.min(...r)).toBeGreaterThan(0.08)
  })
})

describe('dropoutMap (the removed cells)', () => {
  const drop = dropoutMap(COLS, ROWS)
  const off = (r: number, c: number) => drop[r * COLS + c] === 1
  const share = (r: number) => mean(Array.from({ length: COLS }, (_, c) => (off(r, c) ? 1 : 0)))
  const fifth = Math.ceil(bandRows.length / 5)

  it('removes nothing above the band or in its top fifth', () => {
    for (let r = 0; r < ROWS; r++) if (!inBand(r)) expect(share(r)).toBe(0)
    for (const r of bandRows.slice(0, fifth)) expect(share(r)).toBe(0)
  })

  it('removes more cells with depth, about half on the last rows', () => {
    const shares = bandRows.map(share)
    // Random per cell, so single rows are noisy (±0.025 at this width, and a dense row makes the
    // no-clump rule turn down more in the next); blocks of 4 rows rise.
    for (let k = 1; k < shares.length; k++) expect(shares[k]).toBeGreaterThanOrEqual(shares[k - 1] - 0.1)
    const blocks = Array.from({ length: Math.floor(shares.length / 4) }, (_, b) => mean(shares.slice(-4 * (b + 1), shares.length - 4 * b))).reverse()
    for (let b = 1; b < blocks.length; b++) expect(blocks[b]).toBeGreaterThanOrEqual(blocks[b - 1] - 0.03)
    expect(blocks[blocks.length - 1] - blocks[0]).toBeGreaterThan(0.3)
    expect(mean(shares.slice(-3))).toBeGreaterThanOrEqual(0.45)
    expect(mean(shares.slice(-3))).toBeLessThanOrEqual(0.65)
  })

  it('never clumps: no 2x2 block of cells is fully removed', () => {
    for (let r = 0; r + 1 < ROWS; r++)
      for (let c = 0; c + 1 < COLS; c++) expect(off(r, c) && off(r, c + 1) && off(r + 1, c) && off(r + 1, c + 1)).toBe(false)
  })

  it('looks random: removals at 1 to 4 cells apart co-occur about as often as chance', () => {
    // Over the band's bottom third, where about half the cells go. A dither or any
    // periodic pattern pushes some of these ratios far from 1.
    const rows = bandRows.slice(-Math.floor(bandRows.length / 3))
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
    for (const r of bandRows.filter((r) => share(r) >= 0.1)) {
      for (let k = 1; k <= 4; k++) {
        const repeats = Array.from({ length: COLS - k }, (_, c) => off(r, c) === off(r, c + k)).every(Boolean)
        expect(repeats).toBe(false)
      }
    }
  })
})

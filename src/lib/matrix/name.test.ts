import { describe, expect, it } from 'vitest'
import { hash2 } from './math'
import { bottomFade, DISSOLVE_BAND, GLYPHS, LINE_GAP, NAME_LINES, nameMask, nameWeight, TIMELINE } from './name'

const mask = nameMask(NAME_LINES, LINE_GAP)
const lit = new Set(mask.cells.map(([r, c]) => `${r},${c}`))

describe('nameMask', () => {
  it('is 23 columns by 11 rows', () => {
    expect(mask.cols).toBe(23)
    expect(mask.rows).toBe(11)
  })

  it('lights the top bar of the T and leaves the gap column empty', () => {
    for (const c of [0, 1, 2]) expect(lit.has(`0,${c}`)).toBe(true)
    expect(lit.has('0,3')).toBe(false)
  })

  it('gives M five columns', () => {
    // DOHM: D 0-2, O 4-6, H 8-10, M 12-16; M's top row is #...#
    expect(lit.has('6,12')).toBe(true)
    expect(lit.has('6,16')).toBe(true)
    expect(lit.has('6,17')).toBe(false)
    expect(Math.max(...mask.cells.filter(([r]) => r >= 6).map(([, c]) => c))).toBe(16)
  })

  it('starts DOHM at row 6', () => {
    expect(Math.min(...mask.cells.filter(([r]) => r >= 5).map(([r]) => r))).toBe(6)
  })

  it('has one lit cell per # in the font table', () => {
    const count = (w: string) => [...w].reduce((s, ch) => s + GLYPHS[ch].join('').split('#').length - 1, 0)
    expect(mask.cells.length).toBe(NAME_LINES.reduce((s, w) => s + count(w), 0))
  })
})

describe('nameWeight', () => {
  const { form, hold, break: brk, ghost } = TIMELINE
  const release = (r: number, c: number) => form + hold + hash2(r, c) * brk

  it('is 0 at t = 0 for the last column', () => {
    expect(nameWeight(0, 22, 3, 23, 0)).toBe(0)
  })

  it('is 0.95 for every cell during the hold', () => {
    for (const [r, c] of mask.cells) expect(nameWeight(form + 0.5, c, r, 23, 0)).toBeCloseTo(0.95, 10)
  })

  it('settles to the ghost, lifted by attention', () => {
    expect(nameWeight(10, 4, 2, 23, 0)).toBeCloseTo(ghost, 10)
    expect(nameWeight(10, 4, 2, 23, 1)).toBeGreaterThanOrEqual(0.95)
    expect(nameWeight(10, 4, 2, 23, 0.4)).toBeCloseTo(ghost + 0.75 * 0.4, 10)
  })

  it('releases cells at different seeded times', () => {
    const times = new Set(mask.cells.map(([r, c]) => release(r, c)))
    expect(times.size).toBeGreaterThan(1)
    // Pick the earliest and latest cells; midway through the earliest one's fade only it has dropped.
    const sorted = [...mask.cells].sort((a, b) => release(a[0], a[1]) - release(b[0], b[1]))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const t = release(first[0], first[1]) + TIMELINE.fade / 2
    expect(nameWeight(t, first[1], first[0], 23, 0)).toBeLessThan(0.95)
    expect(nameWeight(t, last[1], last[0], 23, 0)).toBeCloseTo(0.95, 10)
  })
})

describe('bottomFade', () => {
  // A tall grid: 90 rows, so the band has about 40 rows.
  const ROWS = 90
  const COLS = 400
  const inBand = (r: number) => (ROWS - 1 - r) / ROWS < DISSOLVE_BAND
  const row = (r: number) => Array.from({ length: COLS }, (_, c) => bottomFade(r, ROWS, c))
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length
  const bandRows = Array.from({ length: ROWS }, (_, r) => r).filter(inBand)
  const means = bandRows.map((r) => mean(row(r)))
  const third = Math.ceil(bandRows.length / 3)
  const fifth = Math.ceil(bandRows.length / 5)

  it('covers the lowest 40 to 50% of rows and is 1 above it', () => {
    expect(DISSOLVE_BAND).toBeGreaterThanOrEqual(0.4)
    expect(DISSOLVE_BAND).toBeLessThanOrEqual(0.5)
    for (let r = 0; r < ROWS; r++) if (!inBand(r)) expect(row(r).every((f) => f === 1)).toBe(true)
    for (const r of bandRows) for (const f of row(r)) expect(f >= 0 && f <= 1).toBe(true)
  })

  it('fades continuously: row means fall every row, never by more than 0.05 at once', () => {
    let prev = 1
    for (const m of means) {
      expect(m).toBeLessThan(prev)
      expect(prev - m).toBeLessThanOrEqual(0.05)
      prev = m
    }
  })

  it('reaches about 0 at the bottom, so the hero has no visible edge', () => {
    expect(means[means.length - 1]).toBeLessThanOrEqual(0.03)
    // The last three rows are uniformly dim: no stray bright cell at the edge.
    for (const r of bandRows.slice(-3)) expect(Math.max(...row(r))).toBeLessThanOrEqual(0.12)
    // The jitter has shrunk away there: the cells left on the last row vary by under 5% of their mean.
    const last = row(bandRows[bandRows.length - 1]).filter((f) => f > 0)
    expect((Math.max(...last) - Math.min(...last)) / mean(last)).toBeLessThan(0.05)
  })

  const offShare = (r: number) => row(r).filter((f) => f === 0).length / COLS

  it('removes no cells in the top fifth of the band', () => {
    for (const r of bandRows.slice(0, fifth)) expect(offShare(r)).toBe(0)
  })

  it('removes more cells with depth, about half on the last rows', () => {
    const shares = bandRows.map(offShare)
    // Non-decreasing row to row, allowing a little dither noise.
    for (let k = 1; k < shares.length; k++) expect(shares[k]).toBeGreaterThanOrEqual(shares[k - 1] - 0.03)
    for (const share of shares.slice(-3)) {
      expect(share).toBeGreaterThanOrEqual(0.4)
      expect(share).toBeLessThanOrEqual(0.65)
    }
  })

  it('never clumps: no 2x2 block of cells is fully removed anywhere in the band', () => {
    const off = (r: number, c: number) => bottomFade(r, ROWS, c) === 0
    for (const r of bandRows.slice(0, -1)) {
      for (let c = 0; c < COLS - 1; c++) {
        expect(off(r, c) && off(r, c + 1) && off(r + 1, c) && off(r + 1, c + 1)).toBe(false)
      }
    }
  })

  it('varies from cell to cell in the upper band (a jitter, not a flat gradient)', () => {
    const lit = row(bandRows[Math.floor(bandRows.length / 3)]).filter((f) => f > 0)
    expect(Math.max(...lit) - Math.min(...lit)).toBeGreaterThan(0.08)
  })
})

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
  // A tall grid: 90 rows, so the band has 31 rows.
  const ROWS = 90
  const COLS = 400
  const inBand = (r: number) => (ROWS - 1 - r) / ROWS < DISSOLVE_BAND
  const row = (r: number) => Array.from({ length: COLS }, (_, c) => bottomFade(r, ROWS, c))
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length
  const bandRows = Array.from({ length: ROWS }, (_, r) => r).filter(inBand)
  const means = bandRows.map((r) => mean(row(r)))

  it('covers the lowest 35% of rows and is 1 above it', () => {
    expect(DISSOLVE_BAND).toBeCloseTo(0.35)
    for (let r = 0; r < ROWS; r++) if (!inBand(r)) expect(row(r).every((f) => f === 1)).toBe(true)
    for (const r of bandRows) for (const f of row(r)) expect(f >= 0 && f <= 1).toBe(true)
  })

  it('darkens gradually: row means fall every row, never by more than 0.08 at once', () => {
    let prev = 1
    for (const m of means) {
      expect(m).toBeLessThan(prev)
      expect(prev - m).toBeLessThanOrEqual(0.08)
      prev = m
    }
  })

  it('leaves the last row dim, not gone: its mean is between 0.12 and 0.22', () => {
    expect(means[means.length - 1]).toBeGreaterThanOrEqual(0.12)
    expect(means[means.length - 1]).toBeLessThanOrEqual(0.22)
  })

  it('drops few cells fully: at most 8% of the band, none in its top third', () => {
    const off = (r: number) => row(r).filter((f) => f === 0).length
    const total = bandRows.reduce((s, r) => s + off(r), 0)
    expect(total / (bandRows.length * COLS)).toBeLessThanOrEqual(0.08)
    expect(total).toBeGreaterThan(0)
    const third = Math.ceil(bandRows.length / 3)
    for (const r of bandRows.slice(0, third)) expect(off(r)).toBe(0)
  })

  it('has no holes: no fully-off cell touches more than one other fully-off cell', () => {
    const off = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS && bottomFade(r, ROWS, c) === 0
    for (const r of bandRows) {
      for (let c = 0; c < COLS; c++) {
        if (!off(r, c)) continue
        let n = 0
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && off(r + dr, c + dc)) n++
        expect(n).toBeLessThanOrEqual(1)
      }
    }
  })

  it('varies from cell to cell within a row (a jitter, not a flat gradient)', () => {
    const r = bandRows[Math.floor(bandRows.length / 2)]
    const lit = row(r).filter((f) => f > 0)
    expect(Math.max(...lit) - Math.min(...lit)).toBeGreaterThan(0.1)
  })
})

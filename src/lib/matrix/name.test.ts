import { describe, expect, it } from 'vitest'
import { hash2 } from './math'
import { GLYPHS, LINE_GAP, NAME_LINES, nameMask, nameWeight, TIMELINE } from './name'

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

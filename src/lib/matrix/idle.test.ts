import { describe, expect, it } from 'vitest'
import { cellAt, layoutGrid } from './geometry'
import { idleQuery } from './idle'
import { fadeMap } from './intro'
import { DISSOLVE_BAND, fadeRows } from './dissolve'

// Ten minutes of the loop at 30 fps covers many cycles of both sines.
const path = (w: number, h: number) => Array.from({ length: 18000 }, (_, i) => idleQuery(i / 30, w, h))
const extent = (v: number[]) => Math.max(...v) - Math.min(...v)

describe('idleQuery', () => {
  it('never enters the bottom dissolve band', () => {
    for (const [w, h] of [[1440, 900], [390, 844], [844, 390]]) {
      for (const [x, y] of path(w, h)) {
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(h * (1 - DISSOLVE_BAND))
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(w)
      }
    }
  })

  it('stays between the middle of the top fade and the bottom fade (at the buttons or the fallback band), never in the bottom fade', () => {
    // [width, height, pitch, anchor x, anchor y, the buttons' bottom edge (null: none)]
    const views: Array<[number, number, number, number, number, number | null]> = [
      [390, 844, 14, 24, 284, 559], [1366, 657, 27, 203, 127, 539], [1440, 900, 32, 240, 207, 678],
      [375, 667, 14, 24, 204, 480], [1440, 900, 32, 240, 207, null], [390, 844, 14, 24, 120, 260],
    ]
    for (const [w, h, pitch, ax, ay, top] of views) {
      const grid = layoutGrid(w, h, pitch, ax, ay)
      const rows = fadeRows(grid, top, ay)
      const fade = fadeMap(grid, new Int32Array(0), rows)
      const pts = Array.from({ length: 18000 }, (_, i) => idleQuery(i / 30, w, h, rows.floor, rows.ceiling))
      const yTop = Math.max(0.14 * h, rows.ceiling)
      for (const [x, y] of pts) {
        expect(y).toBeGreaterThanOrEqual(yTop - 1e-9)
        expect(y).toBeLessThanOrEqual(Math.max(yTop, rows.floor) + 1e-9)
        const i = cellAt(grid, x, y)
        if (Math.floor(i / grid.cols) >= rows.full) expect(fade[i]).toBe(1) // below the top fade: fully visible
      }
      // It roams most of the space between the fades: its y extent fills the range.
      const ys = pts.map(([, y]) => y)
      expect(extent(ys)).toBeGreaterThan(0.95 * (Math.max(yTop, Math.min(0.48 * h, rows.floor)) - yTop))
    }
  })

  it('starts its y range at a ceiling below 0.14H, keeping its shape', () => {
    const ceiling = 0.3 * 844
    const floor = 0.45 * 844
    for (const t of [0, 1.7, 12.3, 95]) {
      const [x, y] = idleQuery(t, 390, 844, floor, ceiling)
      expect(x).toBe(idleQuery(t, 390, 844)[0])
      expect(y).toBeCloseTo(ceiling + (floor - ceiling) * (0.5 + 0.5 * Math.sin(t * 0.23 + 1)), 9)
    }
    // A ceiling above 0.14H changes nothing.
    for (const t of [0, 5, 40]) expect(idleQuery(t, 390, 844, Infinity, 0.1 * 844)).toEqual(idleQuery(t, 390, 844))
  })

  it('squeezes its y range under a floor, keeping its shape', () => {
    const floor = 0.3 * 844
    for (const t of [0, 1.7, 12.3, 95]) {
      const [x, y] = idleQuery(t, 390, 844, floor)
      expect(x).toBe(idleQuery(t, 390, 844)[0])
      expect(y).toBeCloseTo(0.14 * 844 + (floor - 0.14 * 844) * (0.5 + 0.5 * Math.sin(t * 0.23 + 1)), 9)
    }
    const ys = Array.from({ length: 18000 }, (_, i) => idleQuery(i / 30, 390, 844, floor)[1])
    expect(Math.max(...ys)).toBeLessThanOrEqual(floor)
    // A floor below its usual lowest point (0.48H) changes nothing.
    for (const t of [0, 5, 40]) expect(idleQuery(t, 390, 844, 0.6 * 844)).toEqual(idleQuery(t, 390, 844))
  })

  it('is the mockup drift, its y range scaled to fit above the band: W(0.5 + 0.34 sin(0.31t) cos(0.13t)), H(0.31 + 0.17 sin(0.23t + 1))', () => {
    for (const t of [0, 1.7, 12.3, 95]) {
      const [x, y] = idleQuery(t, 1366, 657)
      expect(x).toBeCloseTo(1366 * (0.5 + 0.34 * Math.sin(t * 0.31) * Math.cos(t * 0.13)), 9)
      expect(y).toBeCloseTo(657 * (0.31 + 0.17 * Math.sin(t * 0.23 + 1)), 9)
    }
  })

  it('scales its x extent with the width and its y extent with the height', () => {
    const wide = path(1600, 400)
    const tall = path(400, 1600)
    const xs = (p: [number, number][]) => p.map(([x]) => x)
    const ys = (p: [number, number][]) => p.map(([, y]) => y)
    expect(extent(xs(wide)) / 1600).toBeCloseTo(extent(xs(tall)) / 400, 6)
    expect(extent(xs(wide)) / 1600).toBeGreaterThan(0.6)
    expect(extent(ys(wide)) / 400).toBeCloseTo(0.34, 2)
    expect(extent(ys(tall)) / 1600).toBeCloseTo(0.34, 2)
  })
})

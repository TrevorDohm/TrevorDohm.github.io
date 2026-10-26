import { describe, expect, it } from 'vitest'
import { cellAt, layoutGrid } from './geometry'
import { idleQuery } from './idle'
import { fadeMap } from './intro'
import { DISSOLVE_BAND } from './name'

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

  it('stays over fully visible cells of the grid', () => {
    const views = [[390, 844, 14, 24, 300], [1366, 657, 27, 230, 90], [1440, 900, 32, 350, 160], [375, 667, 14, 24, 200]]
    for (const [w, h, pitch, ax, ay] of views) {
      const grid = layoutGrid(w, h, pitch, ax, ay)
      const fade = fadeMap(grid, new Int32Array(0))
      for (const [x, y] of path(w, h)) expect(fade[cellAt(grid, x, y)]).toBe(1)
    }
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

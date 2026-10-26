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
    const grid = layoutGrid(390, 844, 14, 24, 167)
    const fade = fadeMap(grid)
    for (const [x, y] of path(390, 844)) expect(fade[cellAt(grid, x, y)]).toBe(1)
  })

  it('scales its x extent with the width and its y extent with the height', () => {
    const wide = path(1600, 400)
    const tall = path(400, 1600)
    const xs = (p: [number, number][]) => p.map(([x]) => x)
    const ys = (p: [number, number][]) => p.map(([, y]) => y)
    expect(extent(xs(wide)) / 1600).toBeCloseTo(0.76, 2)
    expect(extent(xs(tall)) / 400).toBeCloseTo(0.76, 2)
    expect(extent(ys(wide)) / 400).toBeCloseTo(0.76 * (1 - DISSOLVE_BAND), 2)
    expect(extent(ys(tall)) / 1600).toBeCloseTo(0.76 * (1 - DISSOLVE_BAND), 2)
  })
})

import { describe, expect, it } from 'vitest'
import { applyBoost, DROP, dropAt, introAlpha } from './effects'
import { layoutGrid } from './geometry'

describe('dropAt', () => {
  const ages = Array.from({ length: 121 }, (_, i) => i * 0.01) // 0 to 1.2 s
  const distances = Array.from({ length: 201 }, (_, i) => i * 0.05) // 0 to 10 cells

  it('adds nothing at 4 cells or more from the click, at any time', () => {
    for (const age of ages) for (const d of distances) if (d >= 4) expect(dropAt(d, age)).toBe(0)
  })

  it('is gone by 0.8 s, and before the click', () => {
    for (const d of distances) {
      expect(dropAt(d, -0.01)).toBe(0)
      for (const age of ages) if (age >= 0.8) expect(dropAt(d, age)).toBe(0)
    }
    expect(DROP.lifetime).toBeLessThanOrEqual(0.8)
  })

  it('never adds more than 0.7', () => {
    let peak = 0
    for (const age of ages) for (const d of distances) peak = Math.max(peak, dropAt(d, age))
    expect(peak).toBeLessThanOrEqual(0.7)
    expect(peak).toBeGreaterThan(0.6) // the clicked cell flashes near full
  })

  it('starts on the clicked cell and sends a ring out to about 3 cells', () => {
    const crest = (age: number) => distances.reduce((best, d) => (dropAt(d, age) > dropAt(best, age) ? d : best), 0)
    expect(dropAt(0, 0)).toBeCloseTo(DROP.peak)
    expect(crest(0.05)).toBeLessThan(crest(0.2))
    expect(crest(0.2)).toBeLessThan(crest(0.45))
    expect(crest(0.6)).toBeLessThanOrEqual(3.1)
    expect(crest(0.6)).toBeGreaterThan(2)
  })

  it('peaks lower the farther a cell is from the click', () => {
    const most = (d: number) => Math.max(...ages.map((age) => dropAt(d, age)))
    for (let d = 0.5; d < 4; d += 0.5) expect(most(d)).toBeLessThan(most(d - 0.5))
  })
})

describe('introAlpha', () => {
  const rows = 3
  const cols = 7
  const corners = [
    [0, 0],
    [0, cols - 1],
    [rows - 1, 0],
    [rows - 1, cols - 1],
  ]

  it('hides every corner cell at the start and shows it at the end', () => {
    for (const [r, c] of corners) {
      expect(introAlpha(0, r, c, rows, cols)).toBe(0)
      expect(introAlpha(1, r, c, rows, cols)).toBe(1)
    }
  })

  it('reveals the top-left corner before the bottom-right', () => {
    expect(introAlpha(0.4, 0, 0, rows, cols)).toBeGreaterThan(
      introAlpha(0.4, rows - 1, cols - 1, rows, cols),
    )
  })

  it('handles a single cell', () => {
    expect(introAlpha(0, 0, 0, 1, 1)).toBe(0)
    expect(introAlpha(1, 0, 0, 1, 1)).toBe(1)
  })
})

describe('applyBoost', () => {
  const grid = layoutGrid(400, 400, 20, 0, 0) // 20 x 20 cells of 20px
  const count = grid.cols * grid.rows
  const at = (col: number, row: number) => ({ x: grid.centers[(row * grid.cols + col) * 2], y: grid.centers[(row * grid.cols + col) * 2 + 1] })

  it('resets the buffer each call', () => {
    const boost = new Float32Array(count).fill(9)
    applyBoost(boost, grid, [], 0)
    expect(Math.max(...boost)).toBe(0)
  })

  it('boosts no cell 4 or more cells from a click', () => {
    const boost = new Float32Array(count)
    const click = { ...at(10, 10), start: 0 }
    for (let ms = 0; ms <= 900; ms += 25) {
      applyBoost(boost, grid, [click], ms)
      for (let i = 0; i < count; i++) {
        const d = Math.hypot(grid.centers[i * 2] - click.x, grid.centers[i * 2 + 1] - click.y) / grid.pitch
        if (d >= 4) expect(boost[i]).toBe(0)
      }
    }
  })

  it('caps rapid clicks on one spot at the peak', () => {
    const boost = new Float32Array(count)
    const clicks = Array.from({ length: 6 }, (_, k) => ({ ...at(10, 10), start: k * 10 }))
    applyBoost(boost, grid, clicks, 60)
    expect(Math.max(...boost)).toBeLessThanOrEqual(DROP.peak + 1e-6)
    expect(Math.max(...boost)).toBeGreaterThan(0.6)
  })

  it('matches dropAt on each cell near the click', () => {
    const boost = new Float32Array(count)
    applyBoost(boost, grid, [{ ...at(3, 3), start: 0 }], 300)
    expect(boost[3 * grid.cols + 5]).toBeCloseTo(dropAt(2, 0.3), 6)
  })
})

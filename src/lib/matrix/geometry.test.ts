import { describe, expect, it } from 'vitest'
import { CELL_FILL, cellAt, layoutGrid } from './geometry'

describe('layoutGrid', () => {
  const grid = layoutGrid(1000, 600, 40, 130, 90)

  it('puts a cell boundary at the anchor, with the origin at or before the top-left', () => {
    expect(grid.originX).toBeCloseTo(130 - 4 * 40)
    expect(grid.originY).toBeCloseTo(90 - 3 * 40)
    expect(grid.originX).toBeLessThanOrEqual(0)
    expect(grid.originY).toBeLessThanOrEqual(0)
    expect(grid.originX).toBeGreaterThan(-40)
    expect(grid.originY).toBeGreaterThan(-40)
  })

  it('uses the fewest columns and rows that reach past the far edges', () => {
    expect(grid.cols).toBe(26)
    expect(grid.rows).toBe(16)
    expect(grid.originX + grid.cols * 40).toBeGreaterThanOrEqual(1000)
    expect(grid.originX + (grid.cols - 1) * 40).toBeLessThan(1000)
    expect(grid.originY + grid.rows * 40).toBeGreaterThanOrEqual(600)
    expect(grid.originY + (grid.rows - 1) * 40).toBeLessThan(600)
  })

  it('sizes the drawn cell from the pitch', () => {
    expect(grid.pitch).toBe(40)
    expect(grid.cell).toBeCloseTo(40 * CELL_FILL)
  })

  it('stores one center per cell, row-major, on the anchor lattice', () => {
    expect(grid.centers.length).toBe(26 * 16 * 2)
    expect(grid.centers[0]).toBeCloseTo(-30 + 20)
    expect(grid.centers[1]).toBeCloseTo(-30 + 20)
    expect(grid.centers[2] - grid.centers[0]).toBeCloseTo(40)
    expect(grid.centers[3]).toBeCloseTo(grid.centers[1])
    expect(grid.centers[26 * 2 + 1] - grid.centers[1]).toBeCloseTo(40)
    // column 4 is the first cell right of the anchor boundary
    expect(grid.centers[4 * 2]).toBeCloseTo(130 + 20)
  })

  it('keeps the origin at 0 when the anchor is on the lattice already', () => {
    const g = layoutGrid(100, 100, 20, 0, 0)
    expect(g.originX).toBeCloseTo(0)
    expect(g.originY).toBeCloseTo(0)
    expect(g.cols).toBe(5)
    expect(g.rows).toBe(5)
  })
})

describe('cellAt', () => {
  const grid = layoutGrid(1000, 600, 40, 130, 90)

  it('round-trips every cell center to its own index', () => {
    for (let i = 0; i < grid.cols * grid.rows; i++) {
      expect(cellAt(grid, grid.centers[i * 2], grid.centers[i * 2 + 1])).toBe(i)
    }
  })

  it('returns -1 outside the grid', () => {
    expect(cellAt(grid, grid.originX - 1, 10)).toBe(-1)
    expect(cellAt(grid, 10, grid.originY - 1)).toBe(-1)
    expect(cellAt(grid, grid.originX + grid.cols * grid.pitch + 1, 10)).toBe(-1)
    expect(cellAt(grid, 10, grid.originY + grid.rows * grid.pitch + 1)).toBe(-1)
  })
})

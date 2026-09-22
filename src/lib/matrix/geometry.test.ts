import { describe, expect, it } from 'vitest'
import { CELL_FILL, cellAt, cellsPerSide, layoutGrid } from './geometry'

describe('cellsPerSide', () => {
  it('uses 14 cells below the mobile breakpoint and 24 at or above it', () => {
    expect(cellsPerSide(375)).toBe(14)
    expect(cellsPerSide(767)).toBe(14)
    expect(cellsPerSide(768)).toBe(24)
    expect(cellsPerSide(1280)).toBe(24)
  })
})

describe('layoutGrid on desktop', () => {
  const grid = layoutGrid(1280, 800)

  it('sizes the square grid from the smaller of the height and width limits', () => {
    // side = min(800 * 0.85, 1280 * 0.55) = min(680, 704) = 680
    expect(grid.n).toBe(24)
    expect(grid.pitch).toBeCloseTo(680 / 24)
    expect(grid.cell).toBeCloseTo((680 / 24) * CELL_FILL)
  })

  it('places the grid near the right edge and centers it vertically', () => {
    expect(grid.originX).toBeCloseTo(1280 - 680 - 1280 * 0.04)
    expect(grid.originY).toBeCloseTo((800 - 680) / 2)
    expect(grid.originX + grid.n * grid.pitch).toBeLessThanOrEqual(1280)
  })

  it('stores one center per cell, row-major', () => {
    expect(grid.centers.length).toBe(24 * 24 * 2)
    expect(grid.centers[0]).toBeCloseTo(grid.originX + grid.pitch / 2)
    expect(grid.centers[1]).toBeCloseTo(grid.originY + grid.pitch / 2)
    // cell 1 is one pitch to the right of cell 0, same row
    expect(grid.centers[2] - grid.centers[0]).toBeCloseTo(grid.pitch)
    expect(grid.centers[3]).toBeCloseTo(grid.centers[1])
    // cell n is one pitch below cell 0
    expect(grid.centers[24 * 2 + 1] - grid.centers[1]).toBeCloseTo(grid.pitch)
  })
})

describe('layoutGrid on a phone', () => {
  it('fills most of the width and centers the grid', () => {
    const grid = layoutGrid(375, 812)
    const side = 375 * 0.92
    expect(grid.n).toBe(14)
    expect(grid.pitch).toBeCloseTo(side / 14)
    expect(grid.originX).toBeCloseTo((375 - side) / 2)
    expect(grid.originY).toBeCloseTo((812 - side) / 2)
  })
})

describe('cellAt', () => {
  const grid = layoutGrid(1280, 800)
  const at = (col: number, row: number) =>
    [grid.originX + (col + 0.5) * grid.pitch, grid.originY + (row + 0.5) * grid.pitch] as const

  it('returns the row-major index of the cell under a point', () => {
    expect(cellAt(grid, ...at(0, 0))).toBe(0)
    expect(cellAt(grid, ...at(2, 1))).toBe(1 * 24 + 2)
    expect(cellAt(grid, ...at(23, 23))).toBe(24 * 24 - 1)
  })

  it('returns -1 outside the grid', () => {
    expect(cellAt(grid, grid.originX - 1, grid.originY + 10)).toBe(-1)
    expect(cellAt(grid, grid.originX + 10, grid.originY - 1)).toBe(-1)
    expect(cellAt(grid, grid.originX + grid.n * grid.pitch + 1, grid.originY + 10)).toBe(-1)
  })
})

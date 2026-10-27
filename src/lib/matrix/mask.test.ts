import { describe, expect, it } from 'vitest'
import { layoutGrid } from './geometry'
import { copyMask, EDGE, EDGE_DIM, lineRects, MASK_DIM, MASKED, maskedWeight } from './mask'

// 10 x 10 cells of 10 px, origin at (0, 0).
const grid = layoutGrid(100, 100, 10, 0, 0)
const lit = (mask: Uint8Array) => [...mask.keys()].filter((i) => mask[i] === MASKED)
const edge = (mask: Uint8Array) => [...mask.keys()].filter((i) => mask[i] === EDGE)

describe('copyMask', () => {
  it('marks every cell a rect overlaps', () => {
    const mask = copyMask(grid, [{ left: 15, top: 25, right: 31, bottom: 29 }], new Int32Array(0))
    expect(lit(mask)).toEqual([21, 22, 23])
  })

  it('leaves out cells that only touch a rect edge', () => {
    const mask = copyMask(grid, [{ left: 20, top: 20, right: 40, bottom: 30 }], new Int32Array(0))
    expect(lit(mask)).toEqual([22, 23])
  })

  it('combines rects and keeps exempt (name) cells unmasked', () => {
    const rects = [
      { left: 0, top: 0, right: 15, bottom: 5 },
      { left: 85, top: 95, right: 99, bottom: 99 },
    ]
    const mask = copyMask(grid, rects, Int32Array.from([1, -1]))
    expect(lit(mask)).toEqual([0, 98, 99])
  })

  it('clips rects to the grid and ignores empty ones', () => {
    const rects = [
      { left: -50, top: -50, right: 5, bottom: 5 },
      { left: 50, top: 50, right: 50, bottom: 80 },
      { left: 95, top: 95, right: 400, bottom: 400 },
    ]
    expect(lit(copyMask(grid, rects, new Int32Array(0)))).toEqual([0, 99])
  })

  it('follows the grid origin when the lattice is offset', () => {
    const offset = layoutGrid(100, 100, 10, 5, 5) // origin (-5, -5), 11 x 11
    const mask = copyMask(offset, [{ left: 6, top: 6, right: 14, bottom: 14 }], new Int32Array(0))
    expect(lit(mask)).toEqual([offset.cols + 1])
  })

  it('keeps the gap between two buttons on one row unmasked', () => {
    // Two buttons on row 5: cols 0-2 and cols 7-9. Cols 4 and 5 are 2 cells from both.
    const rects = [
      { left: 0, top: 50, right: 30, bottom: 60 },
      { left: 70, top: 50, right: 100, bottom: 60 },
    ]
    const mask = copyMask(grid, rects, new Int32Array(0))
    expect(lit(mask)).toEqual([50, 51, 52, 57, 58, 59])
    for (const col of [4, 5]) expect(mask[50 + col]).toBe(0)
    expect(mask[53]).toBe(EDGE)
    expect(mask[56]).toBe(EDGE)
  })

  it('rings masked cells with a one-cell soft edge, never on exempt cells', () => {
    const mask = copyMask(grid, [{ left: 41, top: 41, right: 59, bottom: 49 }], Int32Array.from([33]))
    expect(lit(mask)).toEqual([44, 45])
    // Rows 3 to 5, cols 3 to 6, minus the two masked cells and the exempt cell 33.
    expect(edge(mask)).toEqual([34, 35, 36, 43, 46, 53, 54, 55, 56])
    expect(mask[33]).toBe(0)
    expect(mask[22]).toBe(0) // two cells away
  })
})

describe('maskedWeight', () => {
  it('dims masked and edge cells by a factor, keeping the shape of the glow', () => {
    expect(maskedWeight(0.8, 0)).toBe(0.8)
    expect(maskedWeight(0.8, MASKED)).toBeCloseTo(0.8 * MASK_DIM)
    expect(maskedWeight(0.8, EDGE)).toBeCloseTo(0.8 * EDGE_DIM)
    expect(maskedWeight(0.4, EDGE) / maskedWeight(0.8, EDGE)).toBeCloseTo(0.5) // proportional, not a flat cap
    expect(MASK_DIM).toBeLessThan(EDGE_DIM)
    expect(EDGE_DIM).toBeLessThan(1)
  })
})

describe('lineRects', () => {
  it('merges fragments that share a line and keeps lines apart', () => {
    const merged = lineRects([
      { left: 10, top: 0, right: 40, bottom: 20 },
      { left: 40, top: 2, right: 90, bottom: 18 }, // same line, a styled span
      { left: 10, top: 29, right: 60, bottom: 49 }, // next line
    ])
    expect(merged).toEqual([
      { left: 10, top: 0, right: 90, bottom: 20 },
      { left: 10, top: 29, right: 60, bottom: 49 },
    ])
  })

  it('keeps lines apart when they only overlap a little (tight leading)', () => {
    const lines = [
      { left: 10, top: 0, right: 90, bottom: 22 },
      { left: 10, top: 18, right: 60, bottom: 40 }, // 4px overlap, under half of 22
    ]
    expect(lineRects(lines)).toEqual(lines)
  })

  it('drops empty fragments', () => {
    expect(lineRects([{ left: 5, top: 0, right: 5, bottom: 20 }])).toEqual([])
  })
})

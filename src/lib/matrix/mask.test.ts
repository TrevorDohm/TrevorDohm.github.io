import { describe, expect, it } from 'vitest'
import { layoutGrid } from './geometry'
import { copyMask } from './mask'

// 10 x 10 cells of 10 px, origin at (0, 0).
const grid = layoutGrid(100, 100, 10, 0, 0)
const lit = (mask: Uint8Array) => [...mask.keys()].filter((i) => mask[i] === 1)

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
})

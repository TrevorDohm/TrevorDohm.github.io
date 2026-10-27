import { describe, expect, it } from 'vitest'
import { layoutGrid } from './geometry'
import {
  composeTargets,
  fadeMap,
  INTRO_END,
  introQuery,
  moveName,
  NAME,
  nameCells,
} from './intro'
import { bottomFade, dropoutMap, fadeRows, topFade } from './dissolve'
import { TIMELINE } from './name'

describe('nameCells', () => {
  it('puts the name block with its top-left cell at the anchor', () => {
    const grid = layoutGrid(400, 300, 10, 35, 52)
    const cells = nameCells(grid, 35, 52)
    expect(cells).toHaveLength(NAME.cells.length)
    NAME.cells.forEach(([r, c], k) => {
      const i = cells[k]
      const x = grid.centers[i * 2]
      const y = grid.centers[i * 2 + 1]
      expect(x).toBeCloseTo(35 + (c + 0.5) * 10, 3)
      expect(y).toBeCloseTo(52 + (r + 0.5) * 10, 3)
    })
  })

  it('marks cells that fall off the grid with -1', () => {
    const grid = layoutGrid(100, 40, 10, 0, 0)
    const cells = nameCells(grid, 0, 0)
    const off = NAME.cells.filter(([r, c]) => r >= grid.rows || c >= grid.cols).length
    expect(off).toBeGreaterThan(0)
    expect([...cells].filter((i) => i === -1)).toHaveLength(off)
  })
})

describe('fadeMap', () => {
  it('keeps exempt cells (the name) whole, even inside the band', () => {
    const grid = layoutGrid(50, 100, 10, 0, 0)
    const last = grid.cols * grid.rows - 1
    const fade = fadeMap(grid, Int32Array.from([-1, last, 3]), fadeRows(grid, null))
    expect(fade[last]).toBe(1)
    expect(fade[last - 1]).toBeLessThan(1)
    expect(fade[3]).toBe(1) // top row: inside the top fade too
    expect(fade[2]).toBe(0)
  })

  it('is the lesser of bottomFade and topFade per cell, or 0 where dropoutMap removes the cell', () => {
    const grid = layoutGrid(300, 400, 10, 0, 0)
    const rows = fadeRows(grid, 280, 120)
    const fade = fadeMap(grid, new Int32Array(0), rows)
    const drop = dropoutMap(grid.cols, grid.rows, rows.dropStart, rows.dropEnd)
    expect(fade[rows.full * grid.cols]).toBe(1)
    expect(drop.slice(0, rows.dropEnd * grid.cols).some((d) => d === 1)).toBe(true)
    expect(drop.slice(rows.dropStart * grid.cols).some((d) => d === 1)).toBe(true)
    fade.forEach((f, i) => {
      const [row, col] = [Math.floor(i / grid.cols), i % grid.cols]
      const expected = drop[i] ? 0 : Math.min(bottomFade(row, grid.rows, col, rows.dimStart), topFade(row, col, rows.full))
      expect(f).toBeCloseTo(expected)
    })
  })
})

describe('introQuery', () => {
  const centre: [number, number] = [100, 50]
  const idle: [number, number] = [300, 250]

  it('sits on the name centre until the break starts', () => {
    expect(introQuery(0, centre, idle)).toEqual(centre)
    expect(introQuery(TIMELINE.form + TIMELINE.hold, centre, idle)).toEqual(centre)
  })

  it('reaches the idle point by the end of the break', () => {
    const mid = introQuery(TIMELINE.form + TIMELINE.hold + TIMELINE.break / 2, centre, idle)
    expect(mid[0]).toBeCloseTo(200)
    expect(mid[1]).toBeCloseTo(150)
    expect(introQuery(INTRO_END, centre, idle)).toEqual(idle)
    expect(introQuery(INTRO_END + 10, centre, idle)).toEqual(idle)
  })
})

describe('composeTargets', () => {
  const grid = layoutGrid(400, 200, 10, 20, 30)
  const count = grid.cols * grid.rows
  const cells = nameCells(grid, 20, 30)
  const isName = new Set(cells)
  const attention = new Float32Array(count).fill(0.5)
  const target = new Float32Array(count)

  it('keeps the background dark and the name lit during the hold', () => {
    composeTargets(target, attention, grid, cells, TIMELINE.form + 0.1)
    for (let i = 0; i < count; i++) {
      if (isName.has(i)) expect(target[i]).toBeCloseTo(0.95)
      else expect(target[i]).toBe(0)
    }
  })

  it('lights the name from the left first while forming', () => {
    composeTargets(target, attention, grid, cells, 0.2)
    const left = cells[NAME.cells.findIndex(([, c]) => c === 0)]
    const right = cells[NAME.cells.findIndex(([, c]) => c === NAME.cols - 1)]
    expect(target[left]).toBeGreaterThan(target[right])
  })

  it('follows attention everywhere once the wave has passed, with a ghost on the name', () => {
    composeTargets(target, attention, grid, cells, INTRO_END + 1)
    for (let i = 0; i < count; i++) {
      if (isName.has(i)) expect(target[i]).toBeCloseTo(Math.max(0.3 + 0.75 * 0.5, 0.5))
      else expect(target[i]).toBeCloseTo(0.9 * 0.5) // the mockup's 0.9 · attention
    }
  })

  it('skips name cells that are off the grid', () => {
    const small = layoutGrid(60, 40, 10, 0, 0)
    const off = nameCells(small, 0, 0)
    const out = new Float32Array(small.cols * small.rows)
    expect(() => composeTargets(out, new Float32Array(out.length), small, off, 1)).not.toThrow()
  })
})

describe('moveName', () => {
  it('carries name weights to the new cells and resets the old ones to target', () => {
    const weights = Float32Array.from([0.9, 0.8, 0, 0, 0, 0])
    const target = Float32Array.from([0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const saved = Float32Array.from([0.9, 0.8])
    moveName(weights, Int32Array.from([0, 1]), Int32Array.from([1, 4]), saved, target)
    expect([...weights].map((v) => Number(v.toFixed(2)))).toEqual([0.1, 0.9, 0, 0, 0.8, 0])
  })

  it('leaves cells with nothing saved at their value', () => {
    const weights = Float32Array.from([0.4, 0.4])
    moveName(weights, new Int32Array(0), Int32Array.from([0, 1]), Float32Array.from([NaN, 0.7]), weights)
    expect([...weights].map((v) => Number(v.toFixed(2)))).toEqual([0.4, 0.7])
  })

  it('ignores off-grid cells on either side', () => {
    const weights = new Float32Array(3)
    moveName(weights, Int32Array.from([-1]), Int32Array.from([-1]), Float32Array.from([1]), weights)
    expect([...weights]).toEqual([0, 0, 0])
  })
})

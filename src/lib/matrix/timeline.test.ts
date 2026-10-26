import { describe, expect, it } from 'vitest'
import { layoutGrid } from './geometry'
import { BREAK_AT, composeTargets, COPY_AT, INTRO_END, INTRO_START, introStart, nameCells, STILL_AT, WAVE_START } from './intro'
import { TIMELINE } from './name'

describe('timeline constants', () => {
  it('derive from TIMELINE', () => {
    expect(WAVE_START).toBeCloseTo(0.9 + 0.6 * 1.6)
    expect(INTRO_END).toBeCloseTo(0.9 + 1.6 + 1.4)
    expect(BREAK_AT).toBeCloseTo(2.5)
    expect(STILL_AT).toBeGreaterThan(TIMELINE.form)
    expect(STILL_AT).toBeLessThan(TIMELINE.form + TIMELINE.hold)
  })

  it('shows the copy at form + 0.2 s, as the mockup', () => {
    expect(COPY_AT).toBeCloseTo(TIMELINE.form + 0.2)
    expect(COPY_AT).toBeCloseTo(1.1)
    expect(COPY_AT).toBeLessThan(BREAK_AT)
  })
})

describe('introStart', () => {
  const grid = layoutGrid(400, 300, 10, 20, 30)
  const cells = nameCells(grid, 20, 30)
  const targetsAt = (t: number) => {
    const target = new Float32Array(grid.cols * grid.rows)
    composeTargets(target, new Float32Array(target.length).fill(0.5), grid, cells, t)
    return target
  }

  it('starts dark while the static name is hidden: at t = 0 no cell is lit, the name included', () => {
    expect(introStart(false)).toBe(INTRO_START)
    expect(INTRO_START).toBe(0)
    expect(Math.max(...targetsAt(introStart(false)))).toBe(0)
  })

  it('starts lit, at the hold, once the static name is already showing (the module ran late)', () => {
    const t = introStart(true)
    expect(t).toBeCloseTo(TIMELINE.form)
    expect(t).toBeLessThan(BREAK_AT)
    const target = targetsAt(t)
    for (const i of cells) expect(target[i]).toBeCloseTo(0.95)
  })
})

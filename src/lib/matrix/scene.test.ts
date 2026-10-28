import { describe, expect, it } from 'vitest'
import { NAME } from './intro'
import type { Layout } from './measure'
import { carryName, layoutScene } from './scene'

const layout = (over: Partial<Layout> = {}): Layout => ({
  width: 390, height: 844, pitch: 14, ax: 24, ay: 284, named: true,
  copy: [], buttonBottom: 600, navBottom: null, key: '', ...over,
})

describe('layoutScene', () => {
  it('lays the grid out from the name anchor, with the name cells and centre', () => {
    const s = layoutScene(layout(), null)
    expect(s.cells.length).toBe(NAME.cells.length)
    expect([...s.cells].every((i) => i >= 0)).toBe(true)
    expect(s.centre).toEqual([24 + (14 * NAME.cols) / 2, 284 + (14 * NAME.rows) / 2])
    expect(s.weights.length).toBe(s.grid.cols * s.grid.rows)
    expect(s.fade.length).toBe(s.weights.length)
    expect(s.copy.length).toBe(s.weights.length)
  })

  it('keeps the arrays when the shape is unchanged and starts fresh when it changes', () => {
    const a = layoutScene(layout(), null)
    const b = layoutScene(layout({ ay: 284 + 3 }), a) // same rows and columns
    expect(b.weights).toBe(a.weights)
    expect(b.target).toBe(a.target)
    const c = layoutScene(layout({ height: 844 + 14 * 3 }), b)
    expect(c.weights).not.toBe(b.weights)
  })

  it('starts the top fade just above the name, not at the nameless fallback', () => {
    const named = layoutScene(layout({ ay: 150 }), null)
    const { originY, pitch } = named.grid
    expect(named.at.full).toBe(Math.round((150 - originY) / pitch) - 1)
    const nameless = layoutScene(layout({ ay: 150, named: false }), null)
    expect(named.at.full).not.toBe(nameless.at.full) // so the name top is what set it
  })

  it('ends the top fade at the nav edge when there is one', () => {
    const s = layoutScene(layout({ ay: 284, navBottom: 135 }), null)
    const { originY, pitch } = s.grid
    expect(s.at.full).toBe(Math.ceil((135 - originY) / pitch))
    expect(s.at.full).not.toBe(layoutScene(layout({ ay: 284 }), null).at.full) // so the nav edge is what set it
  })

  it('centres the light without a name', () => {
    const s = layoutScene(layout({ named: false, ax: 0, ay: 0 }), null)
    expect(s.cells.length).toBe(0)
    expect(s.centre).toEqual([195, 422])
  })
})

describe('carryName', () => {
  it('starts new arrays from the targets and moves the name weights', () => {
    const a = layoutScene(layout(), null)
    a.target.fill(0.25)
    carryName(a, null, false)
    expect([...a.weights].every((v) => v === 0.25)).toBe(true)
    a.cells.forEach((i, k) => (a.weights[i] = 0.5 + k / 1000))
    const b = layoutScene(layout({ height: 900 }), a) // fresh arrays
    b.target.fill(0.1)
    carryName(b, a, false)
    b.cells.forEach((i, k) => expect(b.weights[i]).toBeCloseTo(0.5 + k / 1000))
    const others = [...b.weights].filter((_, i) => !b.cells.includes(i))
    expect(others.every((v) => Math.abs(v - 0.1) < 1e-6)).toBe(true)
  })

  it('keeps eased weights on a same-shape re-layout, resetting the old name cells', () => {
    const a = layoutScene(layout(), null)
    a.weights.fill(0.3)
    a.cells.forEach((i) => (a.weights[i] = 0.9))
    const b = layoutScene(layout({ ax: 24 + 14 }), a) // name one column right, same shape
    b.target.fill(0.2)
    carryName(b, a, false)
    b.cells.forEach((i) => expect(b.weights[i]).toBeCloseTo(0.9))
    const vacated = [...a.cells].filter((i) => !b.cells.includes(i))
    expect(vacated.length).toBeGreaterThan(0)
    vacated.forEach((i) => expect(b.weights[i]).toBeCloseTo(0.2))
  })
})

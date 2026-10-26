import { describe, expect, it } from 'vitest'
import { applyBoost, idlePoint, introAlpha, rippleAt } from './effects'
import { layoutGrid } from './geometry'

describe('rippleAt', () => {
  const speed = 10
  const width = 1
  const lifetime = 2

  it('is zero before it starts and after its lifetime', () => {
    expect(rippleAt(0, -0.1, speed, width, lifetime)).toBe(0)
    expect(rippleAt(20, lifetime, speed, width, lifetime)).toBe(0)
  })

  it('peaks on the expanding ring', () => {
    const age = 0.5 // ring radius = 5
    const onRing = rippleAt(5, age, speed, width, lifetime)
    expect(onRing).toBeGreaterThan(rippleAt(3, age, speed, width, lifetime))
    expect(onRing).toBeGreaterThan(rippleAt(7, age, speed, width, lifetime))
  })

  it('fades as it ages', () => {
    const early = rippleAt(2, 0.2, speed, width, lifetime)
    const late = rippleAt(15, 1.5, speed, width, lifetime)
    expect(late).toBeLessThan(early)
  })
})

describe('idlePoint', () => {
  it('stays inside the rectangle over a minute and moves over time', () => {
    const points = Array.from({ length: 600 }, (_, i) => idlePoint(i * 0.1, 100, 50, 1200, 700))
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(100)
      expect(x).toBeLessThanOrEqual(1300)
      expect(y).toBeGreaterThanOrEqual(50)
      expect(y).toBeLessThanOrEqual(750)
    }
    expect(points[0]).not.toEqual(points[100])
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
  const grid = layoutGrid(200, 120, 40, 0, 0) // 5 cols x 3 rows
  const { cols, rows } = grid
  const count = cols * rows

  it('boosts exactly the hovered row and column, counting the hovered cell once', () => {
    expect([cols, rows]).toEqual([5, 3])
    const boost = new Float32Array(count)
    const hover = 1 * cols + 3 // row 1, col 3
    applyBoost(boost, grid, hover, [], 0, 0.1)
    expect(Array.from(boost).filter((v) => v !== 0).length).toBe(cols + rows - 1)
    for (let i = 0; i < count; i++) {
      const inAxis = Math.floor(i / cols) === 1 || i % cols === 3
      expect(boost[i]).toBeCloseTo(inAxis ? 0.1 : 0)
    }
  })

  it('resets the buffer each call', () => {
    const boost = new Float32Array(count).fill(9)
    applyBoost(boost, grid, -1, [], 0, 0.1)
    expect(Math.max(...boost)).toBe(0)
  })

  it('lights cells on the ring of an active ripple', () => {
    const wide = layoutGrid(400, 120, 40, 0, 0)
    const boost = new Float32Array(wide.cols * wide.rows)
    // 0.5 s after a click at cell 0, the ring is 7 cells out (speed 14 cells/s).
    applyBoost(boost, wide, -1, [{ x: wide.centers[0], y: wide.centers[1], start: 0 }], 500, 0.1)
    expect(boost[7]).toBeGreaterThan(boost[2])
  })
})

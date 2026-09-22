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
  it('stays inside the box and moves over time', () => {
    const points = Array.from({ length: 200 }, (_, i) => idlePoint(i * 0.5, 100, 50, 400))
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(100)
      expect(x).toBeLessThanOrEqual(500)
      expect(y).toBeGreaterThanOrEqual(50)
      expect(y).toBeLessThanOrEqual(450)
    }
    expect(points[0]).not.toEqual(points[10])
  })
})

describe('introAlpha', () => {
  it('hides every cell at the start and shows every cell at the end', () => {
    expect(introAlpha(0, 0, 0, 24)).toBe(0)
    expect(introAlpha(0, 23, 23, 24)).toBe(0)
    expect(introAlpha(1, 0, 0, 24)).toBe(1)
    expect(introAlpha(1, 23, 23, 24)).toBe(1)
  })

  it('reveals the top-left corner before the bottom-right', () => {
    expect(introAlpha(0.4, 0, 0, 24)).toBeGreaterThan(introAlpha(0.4, 23, 23, 24))
  })
})

describe('applyBoost', () => {
  const grid = layoutGrid(1280, 800)
  const n = grid.n

  it('adds the axis boost once to every cell in the hovered row and column', () => {
    const boost = new Float32Array(n * n)
    const hover = 3 * n + 5 // row 3, col 5
    applyBoost(boost, grid, hover, [], 0, 0.1)
    expect(boost[hover]).toBeCloseTo(0.1)
    expect(boost[3 * n + 0]).toBeCloseTo(0.1)
    expect(boost[0 * n + 5]).toBeCloseTo(0.1)
    expect(boost[0]).toBe(0)
  })

  it('resets the buffer each call', () => {
    const boost = new Float32Array(n * n).fill(9)
    applyBoost(boost, grid, -1, [], 0, 0.1)
    expect(Math.max(...boost)).toBe(0)
  })

  it('lights cells on the ring of an active ripple', () => {
    const boost = new Float32Array(n * n)
    const x = grid.centers[0]
    const y = grid.centers[1]
    // 0.5 s after a click at cell 0, the ring is 7 cells out (speed 14 cells/s).
    applyBoost(boost, grid, -1, [{ x, y, start: 0 }], 500, 0.1)
    expect(boost[7]).toBeGreaterThan(boost[2])
  })
})

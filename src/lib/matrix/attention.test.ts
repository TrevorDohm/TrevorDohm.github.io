import { describe, expect, it } from 'vitest'
import { attentionWeights, easeToward } from './attention'

// Three cells on one row, 10px apart (pitch 10), so distances in cells are 0, 1, 2.
const centers = new Float32Array([0, 0, 10, 0, 20, 0])

describe('attentionWeights', () => {
  it('gives the nearest cell a weight of exactly 1', () => {
    const w = attentionWeights(centers, 10, 0, 0, 1, new Float32Array(3))
    expect(w[0]).toBe(1)
  })

  it('keeps every weight in (0, 1] and decreasing with distance', () => {
    const w = attentionWeights(centers, 10, 0, 0, 1, new Float32Array(3))
    for (const v of w) {
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    expect(w[1]).toBeLessThan(w[0])
    expect(w[2]).toBeLessThan(w[1])
  })

  it('preserves the ratios of a plain softmax over negative distance', () => {
    const temperature = 1.5
    const w = attentionWeights(centers, 10, 3, 4, temperature, new Float32Array(3))
    const d = [0, 1, 2].map((i) => Math.hypot(centers[i * 2] - 3, centers[i * 2 + 1] - 4) / 10)
    const exps = d.map((x) => Math.exp(-x / temperature))
    const sum = exps.reduce((a, b) => a + b, 0)
    const softmax = exps.map((e) => e / sum)
    expect(w[1] / w[0]).toBeCloseTo(softmax[1] / softmax[0])
    expect(w[2] / w[0]).toBeCloseTo(softmax[2] / softmax[0])
  })

  it('spreads attention wider at a higher temperature', () => {
    const cold = attentionWeights(centers, 10, 0, 0, 0.5, new Float32Array(3))
    const warm = attentionWeights(centers, 10, 0, 0, 3, new Float32Array(3))
    expect(warm[2]).toBeGreaterThan(cold[2])
  })

  it('measures distance in cells, so scaling the grid does not change weights', () => {
    const scaled = new Float32Array([0, 0, 20, 0, 40, 0])
    const a = attentionWeights(centers, 10, 0, 0, 1, new Float32Array(3))
    const b = attentionWeights(scaled, 20, 0, 0, 1, new Float32Array(3))
    expect(Array.from(b)).toEqual(Array.from(a))
  })

  it('writes into and returns the output array', () => {
    const out = new Float32Array(3)
    expect(attentionWeights(centers, 10, 0, 0, 1, out)).toBe(out)
  })
})

describe('easeToward', () => {
  it('does not move when no time has passed', () => {
    const current = new Float32Array([0, 1])
    easeToward(current, new Float32Array([1, 0]), 5, 0)
    expect(Array.from(current)).toEqual([0, 1])
  })

  it('covers half the distance after one half-life', () => {
    const current = new Float32Array([0])
    easeToward(current, new Float32Array([1]), Math.LN2, 1)
    expect(current[0]).toBeCloseTo(0.5)
  })

  it('arrives at the target after a long step', () => {
    const current = new Float32Array([0, 10])
    easeToward(current, new Float32Array([1, 2]), 5, 100)
    expect(current[0]).toBeCloseTo(1)
    expect(current[1]).toBeCloseTo(2)
  })

  it('gives the same result for one step or two half steps', () => {
    const once = new Float32Array([0])
    const twice = new Float32Array([0])
    const target = new Float32Array([1])
    easeToward(once, target, 4, 0.2)
    easeToward(twice, target, 4, 0.1)
    easeToward(twice, target, 4, 0.1)
    expect(twice[0]).toBeCloseTo(once[0])
  })
})

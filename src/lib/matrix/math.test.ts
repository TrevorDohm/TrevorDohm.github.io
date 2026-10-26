import { describe, expect, it } from 'vitest'
import { clamp01, hash2 } from './math'

describe('clamp01', () => {
  it('passes values in [0, 1] through and clamps the rest', () => {
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(-2)).toBe(0)
    expect(clamp01(3)).toBe(1)
  })
})

describe('hash2', () => {
  it('is deterministic and in [0, 1)', () => {
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        const v = hash2(i, j)
        expect(hash2(i, j)).toBe(v)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    }
  })
})

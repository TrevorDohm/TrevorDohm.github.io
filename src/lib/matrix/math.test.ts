import { describe, expect, it } from 'vitest'
import { clamp01 } from './math'

describe('clamp01', () => {
  it('passes values in [0, 1] through and clamps the rest', () => {
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(-2)).toBe(0)
    expect(clamp01(3)).toBe(1)
  })
})

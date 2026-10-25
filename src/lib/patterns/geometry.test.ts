import { describe, expect, it } from 'vitest'
import { cellRect, rampMix } from './geometry'

describe('cellRect', () => {
  it('tiles the square with a 10/424 padding and 16% gap', () => {
    const pitch = (424 - 2 * 10) / 12
    const c = cellRect(0, 0, 12, 424)
    expect(c.x).toBeCloseTo(10 + pitch * 0.08)
    expect(c.y).toBeCloseTo(10 + pitch * 0.08)
    expect(c.w).toBeCloseTo(pitch * 0.84)
    const last = cellRect(11, 11, 12, 424)
    expect(last.x + last.w).toBeCloseTo(424 - 10 - pitch * 0.08)
  })

  it('scales padding and radius with size', () => {
    expect(cellRect(0, 0, 12, 424).r).toBeCloseTo(5)
    expect(cellRect(0, 0, 12, 212).r).toBeCloseTo(2.5)
    expect(cellRect(0, 0, 12, 212).x).toBeCloseTo(5 + ((212 - 10) / 12) * 0.08)
  })

  it('puts column j on x and row i on y', () => {
    const a = cellRect(2, 5, 12, 424)
    const b = cellRect(5, 2, 12, 424)
    expect(a.x).toBeGreaterThan(b.x)
    expect(a.y).toBeLessThan(b.y)
  })
})

describe('rampMix', () => {
  it('mixes line into accent below the split', () => {
    expect(rampMix(0.3)).toBe('color-mix(in srgb, var(--color-accent) 50%, var(--color-line))')
  })

  it('mixes accent into accent-2 above the split', () => {
    expect(rampMix(0.8)).toBe(
      'color-mix(in srgb, var(--color-accent-2) 50%, var(--color-accent))',
    )
  })

  it('clamps out-of-range weights', () => {
    expect(rampMix(-1)).toBe('color-mix(in srgb, var(--color-accent) 0%, var(--color-line))')
    expect(rampMix(2)).toBe('color-mix(in srgb, var(--color-accent-2) 100%, var(--color-accent))')
  })
})

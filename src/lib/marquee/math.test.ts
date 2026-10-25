import { describe, expect, it } from 'vitest'
import { approach, durationSeconds, repeatsNeeded, rescaleCurrentTime } from './math'

describe('durationSeconds', () => {
  it('is width over speed', () => expect(durationSeconds(6600, 22)).toBe(300))
  it('is 0 for zero, negative or non-finite input', () => {
    for (const [w, s] of [[0, 22], [100, 0], [-5, 22], [NaN, 22], [100, Infinity]])
      expect(durationSeconds(w, s)).toBe(0)
  })
})

describe('repeatsNeeded', () => {
  it('is 1 when content already covers the viewport', () => expect(repeatsNeeded(3000, 2560)).toBe(1))
  it('repeats short content until it covers the viewport', () => expect(repeatsNeeded(1000, 2560)).toBe(3))
  it('is 1 for zero or non-finite content width', () => {
    expect(repeatsNeeded(0, 2560)).toBe(1)
    expect(repeatsNeeded(NaN, 2560)).toBe(1)
  })
})

describe('rescaleCurrentTime', () => {
  it('keeps the progress fraction', () => expect(rescaleCurrentTime(30, 120, 150)).toBeCloseTo(37.5))
  it('wraps times past one loop', () => expect(rescaleCurrentTime(150, 120, 120)).toBeCloseTo(30))
  it('is 0 when the old duration is not positive', () => expect(rescaleCurrentTime(10, 0, 100)).toBe(0))
})

describe('approach', () => {
  it('moves 1 - e^-rate*dt of the way', () =>
    expect(approach(1, 0.25, 4, 0.25)).toBeCloseTo(0.25 + 0.75 * Math.exp(-1)))
  it('is frame-rate independent', () => {
    let a = 1
    for (let i = 0; i < 2; i++) a = approach(a, 0.25, 4, 0.1)
    expect(a).toBeCloseTo(approach(1, 0.25, 4, 0.2))
  })
})

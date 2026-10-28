import { describe, expect, it } from 'vitest'
import { approach, durationSeconds, frameStep, indexAt, repeatsNeeded, rescaleCurrentTime, revealProgress } from './math'

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

describe('revealProgress', () => {
  // Row 1000px wide, list 3000px wide, 100px item. Centering puts the item's left edge at 450px.
  it('shifts the list so the item is centered', () => expect(revealProgress(2000, 100, 1000, 3000, false)).toBeCloseTo(1550 / 3000))
  it('plays the same shift backward when reversed', () =>
    expect(revealProgress(2000, 100, 1000, 3000, true)).toBeCloseTo(1 - 1550 / 3000))
  // Progress 0 is translateX(0) going forward but translateX(-100%) in reverse.
  it('stops at the list start for items already near it', () => {
    expect(revealProgress(100, 100, 1000, 3000, false)).toBe(0)
    const reversed = revealProgress(100, 100, 1000, 3000, true)
    expect(reversed).toBeCloseTo(1)
    expect(reversed).toBeLessThan(1)
  })
  it('stays below one loop', () => {
    const p = revealProgress(2950, 2000, 1000, 3000, false)
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThan(1)
  })
  it('is 0 for an unusable list width', () => expect(revealProgress(10, 10, 100, 0, false)).toBe(0))
})

describe('frameStep', () => {
  it('is the gap in seconds', () => expect(frameStep(1100, 1000, 0.1)).toBeCloseTo(0.1))
  it('caps a stalled frame', () => expect(frameStep(5000, 1000, 0.1)).toBe(0.1))
  // The first rAF timestamp can be earlier than the performance.now() taken when it was requested.
  it('is 0, not negative, for a frame stamped before the start', () => expect(frameStep(990, 1000, 0.1)).toBe(0))
})

describe('indexAt', () => {
  const boxes = [
    { left: 0, top: 0, right: 100, bottom: 50 },
    { left: 120, top: 0, right: 220, bottom: 50 },
  ]
  it('finds the box under the point', () => expect(indexAt(boxes, 150, 10)).toBe(1))
  it('includes the left and top edges, not the right and bottom', () => {
    expect(indexAt(boxes, 120, 0)).toBe(1)
    expect(indexAt(boxes, 100, 10)).toBe(-1)
    expect(indexAt(boxes, 10, 50)).toBe(-1)
  })
  it('is -1 in a gap', () => expect(indexAt(boxes, 110, 10)).toBe(-1))
})

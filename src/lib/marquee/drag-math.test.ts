import { describe, expect, it } from 'vitest'
import { catchSwallowsTap, coast, dragIntent, driftVelocity, fitVelocity, scrubDelta, wrapTime } from './drag-math'

describe('scrubDelta', () => {
  // A 2000px track that loops in 40s: 50px/s, so 1px is 20ms.
  it('moves a forward row back in time when content is dragged right', () =>
    expect(scrubDelta(100, 40_000, 2000, false)).toBe(-2000))
  it('moves a forward row on in time when content is dragged left', () =>
    expect(scrubDelta(-100, 40_000, 2000, false)).toBe(2000))
  it('flips the sign for a reversed row', () => expect(scrubDelta(100, 40_000, 2000, true)).toBe(2000))
  it('is 0 (never -0) for no movement', () => expect(Object.is(scrubDelta(0, 40_000, 2000, false), 0)).toBe(true))
  it('is 0 for unusable sizes', () => {
    for (const [d, w] of [[0, 2000], [40_000, 0], [NaN, 2000], [40_000, Infinity]])
      expect(scrubDelta(100, d, w, false)).toBe(0)
  })
})

describe('wrapTime', () => {
  it('keeps a time inside the loop', () => expect(wrapTime(1500, 4000)).toBe(1500))
  it('wraps past the end', () => expect(wrapTime(9000, 4000)).toBe(1000))
  it('wraps a negative time to the far end', () => expect(wrapTime(-500, 4000)).toBe(3500))
  it('maps exactly one loop to 0', () => expect(wrapTime(4000, 4000)).toBe(0))
  it('is 0 for an unusable period', () => expect(wrapTime(100, 0)).toBe(0))
})

describe('coast', () => {
  it('decays the velocity exponentially', () => {
    const { v } = coast(1000, 3, 0.5)
    expect(v).toBeCloseTo(1000 * Math.exp(-1.5), 6)
  })
  it('travels the integral of the velocity over the step', () => {
    const { dx } = coast(1000, 3, 0.5)
    expect(dx).toBeCloseTo((1000 * (1 - Math.exp(-1.5))) / 3, 6)
  })
  it('is frame-rate independent: two half steps equal one whole step', () => {
    const a = coast(800, 4, 0.2)
    const b = coast(a.v, 4, 0.2)
    const whole = coast(800, 4, 0.4)
    expect(b.v).toBeCloseTo(whole.v, 9)
    expect(a.dx + b.dx).toBeCloseTo(whole.dx, 9)
  })
  it('never travels more than v / friction in total', () => {
    expect(coast(1200, 3, 1e6).dx).toBeCloseTo(400, 6)
  })
  it('stands still for a zero or negative step', () => {
    expect(coast(500, 3, 0)).toEqual({ v: 500, dx: 0 })
    expect(coast(500, 3, -1)).toEqual({ v: 500, dx: 0 })
  })
})

describe('dragIntent', () => {
  it('waits inside the threshold', () => expect(dragIntent(4, 3, 7)).toBe(null))
  it('is horizontal once past the threshold with |dx| > |dy|', () => expect(dragIntent(-8, 3, 7)).toBe('x'))
  it('is vertical once past the threshold with |dy| >= |dx|', () => {
    expect(dragIntent(2, 9, 7)).toBe('y')
    expect(dragIntent(6, 6, 7)).toBe('y')
  })
  it('measures the distance, not each axis', () => expect(dragIntent(5, 5, 7)).toBe('y'))
})

describe('fitVelocity', () => {
  // Samples every `dt` ms at `v` px/s, ending at `end`.
  const steady = (v: number, dt: number, end: number, n: number) =>
    Array.from({ length: n }, (_, k) => ({ t: end - (n - 1 - k) * dt, x: (v * (end - (n - 1 - k) * dt)) / 1000 }))

  it('gives the speed of constant-speed samples at 120 Hz', () =>
    expect(fitVelocity(steady(1500, 8.33, 1000, 30), 1008, 100, 50)).toBeCloseTo(1500, 6))
  it('gives the speed of constant-speed samples at 60 Hz, leftward', () =>
    expect(fitVelocity(steady(-900, 16.7, 500, 12), 510, 100, 50)).toBeCloseTo(-900, 6))
  it('does not let jittery end samples dominate', () => {
    const samples = steady(1000, 8, 1000, 13) // 96 ms of samples
    samples[0] = { ...samples[0], x: samples[0].x - 4 }
    samples[12] = { ...samples[12], x: samples[12].x + 4 }
    // First-to-last would read 1083 px/s; the fit reads 1033.
    expect(fitVelocity(samples, 1000, 100, 50)).toBeCloseTo(1000 + (8 * 48 * 1000) / (64 * 182), 6)
  })
  it('is 0 when the pointer stopped more than stopMs before release', () => {
    expect(fitVelocity(steady(1200, 8, 400, 20), 455, 100, 50)).toBe(0)
    expect(fitVelocity(steady(1200, 8, 400, 20), 520, 100, 50)).toBe(0) // a 120 ms pause: nothing in the window
  })
  it('keeps the full speed for a release just after the last move', () =>
    expect(fitVelocity(steady(1200, 8, 400, 20), 440, 100, 50)).toBeCloseTo(1200, 6))
  it('is 0 with fewer than two samples or no spread in time', () => {
    expect(fitVelocity([{ t: 10, x: 5 }], 10, 100, 50)).toBe(0)
    expect(fitVelocity([{ t: 10, x: 5 }, { t: 10, x: 9 }], 10, 100, 50)).toBe(0)
  })
})

describe('catchSwallowsTap', () => {
  it('swallows the tap that catches a row moving faster than 50 px/s', () => {
    expect(catchSwallowsTap(400)).toBe(true)
    expect(catchSwallowsTap(-51)).toBe(true)
  })
  it('lets a tap through on a slow or resting row', () => {
    expect(catchSwallowsTap(50)).toBe(false)
    expect(catchSwallowsTap(0)).toBe(false)
  })
})

describe('driftVelocity', () => {
  it('drifts left for a forward row', () => expect(driftVelocity(33, 1, false)).toBe(-33))
  it('drifts right for a reversed row', () => expect(driftVelocity(45, 0.5, true)).toBe(22.5))
  it('is 0 for an unusable speed', () => expect(driftVelocity(NaN, 1, false)).toBe(0))
})

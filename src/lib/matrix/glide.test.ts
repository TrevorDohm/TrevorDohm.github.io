import { describe, expect, it } from 'vitest'
import { idleQuery, idleSpeed } from './idle'
import { createLight, cruiseSpeed, GLIDE_RAMP, smoothQuery, stepLight, type Point } from './query'

const W = 1440
const H = 900
const PITCH = 32
const cruise = cruiseSpeed(W, H)
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * The pointer swipes from mid-screen to a far corner in 0.3 s and leaves at
 * once, with the light still moving after it (the owner's case): from then on
 * the target is the idle path (time from `t0` on the path). Returns the light
 * and the target at every frame after the leave.
 */
function leave(fps: number, seconds: number, swipe = true, corner: Point = [1420, 70], t0 = 10) {
  const dt = 1 / fps
  const light = createLight()
  const from: Point = swipe ? [700, 450] : corner // parked: the same release point at any frame rate
  for (let i = 0; i < fps * 3; i++) stepLight(light, from, true, dt, cruise)
  const frames = swipe ? Math.round(0.3 * fps) : 0
  for (let i = 1; i <= frames; i++) {
    const k = i / frames
    stepLight(light, [from[0] + (corner[0] - from[0]) * k, from[1] + (corner[1] - from[1]) * k], true, dt, cruise)
  }
  const out: Array<{ q: Point; target: Point; step: number }> = []
  let prev: Point = light.q!
  for (let i = 1; i <= fps * seconds; i++) {
    const target = idleQuery(t0 + i * dt, W, H)
    const q = stepLight(light, target, false, dt, cruise)
    out.push({ q, target, step: dist(q, prev) })
    prev = q
  }
  return { frames: out, dt }
}

describe('idleSpeed', () => {
  it('bounds the idle path’s own speed, and not loosely', () => {
    for (const [w, h] of [[1440, 900], [390, 844], [2560, 1440]]) {
      const dt = 1 / 240
      let max = 0
      for (let i = 0; i < 240 * 600; i++) max = Math.max(max, dist(idleQuery((i + 1) * dt, w, h), idleQuery(i * dt, w, h)) / dt)
      expect(max).toBeLessThanOrEqual(idleSpeed(w, h))
      expect(max).toBeGreaterThan(0.85 * idleSpeed(w, h))
    }
  })

  it('sets the cruise speed at 1.25 times that bound', () => {
    expect(cruise).toBeCloseTo(1.25 * idleSpeed(W, H), 9)
    expect(cruiseSpeed(390, 844, 200)).toBeCloseTo(1.25 * idleSpeed(390, 844, 200), 9)
  })
})

describe('stepLight', () => {
  it('follows the pointer exactly as smoothQuery does (the approved drag)', () => {
    const light = createLight()
    let q: Point = [100, 100]
    stepLight(light, q, true, 0, cruise)
    for (let i = 0; i < 120; i++) {
      const target: Point = [100 + i * 13, 100 + i * 2]
      q = smoothQuery(q, target, 1 / 60)
      expect(stepLight(light, target, true, 1 / 60, cruise)).toEqual(q)
    }
  })

  it('after a leave from far away, never moves faster than the cruise speed', () => {
    const { frames, dt } = leave(60, 8)
    for (const f of frames) expect(f.step).toBeLessThanOrEqual(cruise * dt + 1e-9)
  })

  it('does not snap: the first step is tiny and the speed ramps up over about 0.3 s', () => {
    const { frames, dt } = leave(60, 8)
    // One frame of acceleration from rest: (dt / GLIDE_RAMP) of a cruise step, 0.25px at 60fps here.
    expect(frames[0].step).toBeLessThanOrEqual((dt / GLIDE_RAMP) * cruise * dt + 1e-9)
    const ramp = Math.round(GLIDE_RAMP / dt)
    for (let i = 1; i < ramp; i++) expect(frames[i].step).toBeGreaterThan(frames[i - 1].step)
    expect(frames[ramp - 2].step).toBeLessThan(cruise * dt)
    expect(frames[ramp + 2].step).toBeGreaterThan(0.99 * cruise * dt)
  })

  it('rejoins the path in finite time and then rides it', () => {
    const { frames } = leave(60, 12)
    const caught = frames.findIndex((f) => dist(f.q, f.target) < 1e-6)
    expect(caught).toBeGreaterThan(0)
    for (const f of frames.slice(caught)) expect(dist(f.q, f.target)).toBeLessThanOrEqual(PITCH)
    // No jump at the handover: the step there is no bigger than a cruise step.
    expect(frames[caught].step).toBeLessThanOrEqual(cruise / 60 + 1e-9)
  })

  it('is the same at 30, 60 and 144 fps', () => {
    // From the same release point (the light parked on the corner); a swipe's
    // pointer samples differ by frame rate, so its release point does too.
    const at = (fps: number) => {
      const { frames, dt } = leave(fps, 12, false)
      const caught = frames.findIndex((f) => dist(f.q, f.target) < 1e-6)
      return { caughtAt: (caught + 1) * dt, oneSecond: frames[fps - 1].q }
    }
    const ref = at(60)
    for (const fps of [30, 144]) {
      const r = at(fps)
      expect(Math.abs(r.caughtAt - ref.caughtAt)).toBeLessThan(0.1)
      expect(dist(r.oneSecond, ref.oneSecond)).toBeLessThan(1)
    }
  })

  it('eases into motion when the path target starts moving (the intro’s break)', () => {
    const light = createLight()
    const dt = 1 / 60
    const centre: Point = [500, 300]
    for (let i = 0; i < 60; i++) stepLight(light, centre, false, dt, cruise)
    // The target sets off at 3x cruise speed: the light accelerates, it doesn't jump.
    let prev: Point = light.q!
    let prevStep = 0
    for (let i = 1; i <= 60; i++) {
      const q = stepLight(light, [500 + 3 * cruise * i * dt, 300], false, dt, cruise)
      const step = dist(q, prev)
      expect(step - prevStep).toBeLessThanOrEqual((cruise / GLIDE_RAMP) * dt * dt + 1e-9)
      prev = q
      prevStep = step
    }
  })

  it('stays put on a zero-length frame (a re-layout)', () => {
    const { frames } = leave(60, 1)
    const light = createLight()
    stepLight(light, frames[0].q, false, 1 / 60, cruise)
    const q = light.q!
    expect(stepLight(light, [0, 0], false, 0, cruise)).toEqual(q)
  })
})

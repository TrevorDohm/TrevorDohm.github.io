import { describe, expect, it } from 'vitest'
import { idlePeakSpeed, idleQuery } from './idle'
import { createLight, CRUISE_FACTOR, cruiseSpeed, GLIDE_RAMP, smoothQuery, stepLight, type Point } from './query'

const W = 1440
const H = 900
const PITCH = 32
const cruise = cruiseSpeed(W, H)
const ACCEL = cruise / GLIDE_RAMP // px/s gained or shed per second, at most
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * The light follows a pointer, then lets go: `swipe` sweeps it from mid-screen to a far corner in
 * 0.3 s and leaves at once (the owner's case); otherwise the light is parked on the corner. Then the
 * target is the idle path from `t0`. Returns every frame after the release and the last step before.
 */
function leave(fps: number, seconds: number, swipe = true, corner: Point = [1420, 70], t0 = 10) {
  const dt = 1 / fps
  const light = createLight()
  const from: Point = swipe ? [700, 450] : corner
  for (let i = 0; i < fps * 3; i++) stepLight(light, from, true, dt, cruise, PITCH)
  let prev: Point = light.q!
  let lastStep = 0
  const n = swipe ? Math.round(0.3 * fps) : 0
  for (let i = 1; i <= n; i++) {
    const q = stepLight(light, [from[0] + ((corner[0] - from[0]) * i) / n, from[1] + ((corner[1] - from[1]) * i) / n], true, dt, cruise, PITCH)
    lastStep = dist(q, prev)
    prev = q
  }
  const frames: Array<{ q: Point; target: Point; step: number; speed: number }> = []
  for (let i = 1; i <= fps * seconds; i++) {
    const target = idleQuery(t0 + i * dt, W, H)
    const q = stepLight(light, target, false, dt, cruise, PITCH)
    frames.push({ q, target, step: dist(q, prev), speed: dist(q, prev) / dt })
    prev = q
  }
  return { frames, dt, lastStep }
}

describe('idlePeakSpeed', () => {
  it('is the idle path’s actual top speed, within 1%', () => {
    for (const [w, h, floor] of [[1440, 900, Infinity], [390, 844, Infinity], [2560, 1440, Infinity], [390, 844, 200]]) {
      const dt = 1 / 240 // the path's own positions, differenced at 240 Hz over 20 minutes
      let max = 0
      for (let i = 0; i < 240 * 1200; i++) max = Math.max(max, dist(idleQuery((i + 1) * dt, w, h, floor), idleQuery(i * dt, w, h, floor)) / dt)
      expect(Math.abs(idlePeakSpeed(w, h, floor) / max - 1)).toBeLessThan(0.01)
    }
  })

  it('sets the cruise speed a little above it, so the light always catches the path', () => {
    expect(cruise).toBeCloseTo(CRUISE_FACTOR * idlePeakSpeed(W, H), 9)
    expect(CRUISE_FACTOR).toBeGreaterThan(1)
    expect(CRUISE_FACTOR).toBeLessThanOrEqual(1.5)
    expect(cruiseSpeed(390, 844, 200)).toBeCloseTo(CRUISE_FACTOR * idlePeakSpeed(390, 844, 200), 9)
  })
})

describe('stepLight', () => {
  it('follows the pointer exactly as smoothQuery does (the approved drag), and so does the intro', () => {
    for (const following of [true, false]) {
      const light = createLight()
      let q: Point = [100, 100]
      stepLight(light, q, following, 0, cruise, PITCH)
      for (let i = 0; i < 120; i++) {
        const target: Point = [100 + i * 13, 100 + i * 2] // faster than cruise, as in the break
        q = smoothQuery(q, target, 1 / 60)
        expect(stepLight(light, target, following, 1 / 60, cruise, PITCH)).toEqual(q)
      }
    }
  })

  it('after a release never moves faster than cruise, and its speed changes smoothly throughout', () => {
    for (const swipe of [true, false]) {
      const { frames, dt } = leave(60, 12, swipe)
      for (const f of frames) expect(f.step).toBeLessThanOrEqual(cruise * dt + 1e-9)
      // From the first glide frame on (the release itself caps the speed at cruise), including the arrival.
      for (let i = 1; i < frames.length; i++) expect(Math.abs(frames[i].speed - frames[i - 1].speed)).toBeLessThanOrEqual(ACCEL * dt + 0.5)
    }
  })

  it('does not stop dead on release: it carries the light’s own speed (capped at cruise)', () => {
    const { frames, dt, lastStep } = leave(60, 2, true)
    expect(lastStep).toBeGreaterThan(cruise * dt) // the light was moving fast when the pointer left
    expect(frames[0].step).toBeGreaterThan(0.9 * cruise * dt)
  })

  it('from rest, eases in over about 0.3 s', () => {
    const { frames, dt } = leave(60, 2, false)
    expect(frames[0].step).toBeLessThanOrEqual((dt / GLIDE_RAMP) * cruise * dt + 1e-9)
    const ramp = Math.round(GLIDE_RAMP / dt)
    for (let i = 1; i < ramp; i++) expect(frames[i].step).toBeGreaterThan(frames[i - 1].step)
    expect(frames[ramp + 2].step).toBeGreaterThan(0.95 * cruise * dt)
  })

  it('lands on a still target without overshooting, slowing down as it arrives', () => {
    const light = createLight()
    const dt = 1 / 60
    const target: Point = [1000, 400]
    stepLight(light, [200, 400], true, dt, cruise, PITCH)
    let gap = dist(light.q!, target)
    const speeds: number[] = []
    const gaps: number[] = []
    for (let i = 0; i < 60 * 10; i++) {
      const prev = light.q!
      const q = stepLight(light, target, false, dt, cruise, PITCH)
      expect(q[0]).toBeLessThanOrEqual(target[0] + 1e-9) // never past it
      expect(dist(q, target)).toBeLessThanOrEqual(gap + 1e-9)
      gap = dist(q, target)
      speeds.push(dist(q, prev) / dt)
      gaps.push(gap)
    }
    expect(gap).toBeLessThan(0.5)
    // By the time it is within a pixel it has slowed to a crawl, not still at cruise.
    const arrival = gaps.findIndex((g) => g < 1)
    expect(arrival).toBeGreaterThan(0)
    expect(speeds[arrival]).toBeLessThan(0.1 * cruise)
    expect(Math.max(...speeds)).toBeGreaterThan(0.99 * cruise) // and at cruise on the way
  })

  it('is the same at 30, 60 and 144 fps: within 2px at 1, 3, 6 and 9 s', () => {
    // Positions, not threshold times: on the path a sub-pixel lag remains, proportional to the frame time.
    const at = (fps: number) => {
      const { frames } = leave(fps, 12, false)
      return [1, 3, 6, 9].map((s) => frames[s * fps - 1].q)
    }
    const ref = at(60)
    for (const fps of [30, 144]) at(fps).forEach((q, k) => expect(dist(q, ref[k])).toBeLessThan(2))
  })

  it('keeps gliding after a release until the pointer steers it again, then follows it as before', () => {
    const light = createLight()
    const dt = 1 / 60
    stepLight(light, [100, 100], true, dt, cruise, PITCH)
    stepLight(light, [400, 100], false, dt, cruise, PITCH)
    const q = light.q!
    expect(stepLight(light, [900, 100], true, dt, cruise, PITCH)).toEqual(smoothQuery(q, [900, 100], dt))
  })

  it('stays put on a zero-length frame (a re-layout), and a release on one still glides', () => {
    const light = createLight()
    const dt = 1 / 60
    for (let i = 0; i < 30; i++) stepLight(light, [300 + 40 * i, 300], true, dt, cruise, PITCH) // following, fast
    const q = [...light.q!]
    expect(stepLight(light, [100, 700], false, 0, cruise, PITCH)).toEqual(q) // released on a dt = 0 frame
    for (let i = 0; i < 120; i++) {
      const prev = light.q!
      expect(dist(stepLight(light, [100, 700], false, dt, cruise, PITCH), prev)).toBeLessThanOrEqual(cruise * dt + 1e-9)
    }
  })
})

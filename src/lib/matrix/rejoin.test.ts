import { describe, expect, it } from 'vitest'
import { idlePeakSpeed, idleQuery } from './idle'
import { createLight, cruiseSpeed, stepLight, type Point } from './query'

// After a release, how long the light takes to rejoin the idle path (within
// 2px), over the path's phases and several release points.
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

interface View {
  w: number
  h: number
  pitch: number
  fps: number
}

/** Release from rest at `from` with the path at time t0: seconds until within 2px, and the worst gap over the next 10 s. */
function rejoin({ w, h, pitch, fps }: View, from: Point, t0: number): { seconds: number; worstAfter: number } {
  const cruise = cruiseSpeed(w, h)
  const dt = 1 / fps
  const light = createLight()
  stepLight(light, from, true, dt, cruise, pitch)
  for (let i = 1; i <= fps * 60; i++) {
    const q = stepLight(light, idleQuery(t0 + i * dt, w, h), false, dt, cruise, pitch)
    if (dist(q, idleQuery(t0 + i * dt, w, h)) < 2) {
      let worstAfter = 0
      for (let k = 1; k <= fps * 10; k++) {
        const t = t0 + (i + k) * dt
        worstAfter = Math.max(worstAfter, dist(stepLight(light, idleQuery(t, w, h), false, dt, cruise, pitch), idleQuery(t, w, h)))
      }
      return { seconds: i * dt, worstAfter }
    }
  }
  return { seconds: Infinity, worstAfter: Infinity }
}

/** Release points: the four corners and the middle of the top and bottom edges, 20px in. */
const points = ({ w, h }: View): Point[] => [[20, 80], [w - 20, 80], [20, h - 20], [w - 20, h - 20], [w / 2, h - 20], [w / 2, 80]]

/** The worst rejoin over path phases `step` s apart from every release point; each case must then ride the path within a cell. */
function sweep(view: View, step: number, span = 120): number {
  let worst = 0
  for (const p of points(view)) {
    for (let t0 = 0; t0 < span; t0 += step) {
      const r = rejoin(view, p, t0)
      expect(r.worstAfter).toBeLessThanOrEqual(view.pitch)
      worst = Math.max(worst, r.seconds)
    }
  }
  return worst
}

/**
 * The worst rejoin found in each sweep (s); each test's bound is 1.5x it (a 50% margin) and it
 * must still find at least 0.9x it, so a bound can't go stale. Desktop 60fps: from (20, 880) at
 * t0 39, 921px away, with the path heading away (a 0.1 s phase step finds the same 13.33 s).
 */
const WORST = { desktop: 13.33, desktop30: 15.33, phone: 14.98 }
const DESKTOP = { w: 1440, h: 900, pitch: 32, fps: 60 }
const PHONE = { w: 390, h: 844, pitch: 14, fps: 60 }

describe('rejoining the idle path after a release', () => {
  it('desktop, 60 fps: finite and within the bound from 6 points at every 0.5 s of the path', () => {
    const worst = sweep(DESKTOP, 0.5)
    expect(worst).toBeLessThan(WORST.desktop * 1.5)
    expect(worst).toBeGreaterThan(WORST.desktop * 0.9) // the bound is not stale
  })

  it('desktop, 30 fps: finite and within the bound (every 1.5 s of the path)', () => {
    const worst = sweep({ ...DESKTOP, fps: 30 }, 1.5)
    expect(worst).toBeLessThan(WORST.desktop30 * 1.5)
    expect(worst).toBeGreaterThan(WORST.desktop30 * 0.9)
  })

  it('phone (390x844, cruise ~57 px/s), 60 fps: finite and within the bound (every 1 s of the path)', () => {
    const worst = sweep(PHONE, 1)
    expect(worst).toBeLessThan(WORST.phone * 1.5)
    expect(worst).toBeGreaterThan(WORST.phone * 0.9)
  })

  it('catches a path fleeing at its top speed with the light 300px right behind it', () => {
    let t = 0
    let best = 0
    for (let s = 0; s < 1200; s += 0.05) {
      const v = dist(idleQuery(s + 0.001, 1440, 900), idleQuery(s, 1440, 900)) / 0.001
      if (v > best) [best, t] = [v, s]
    }
    expect(best).toBeCloseTo(idlePeakSpeed(1440, 900), 0)
    const p = idleQuery(t, 1440, 900)
    const ahead = idleQuery(t + 0.001, 1440, 900)
    const u = [(ahead[0] - p[0]) / dist(ahead, p), (ahead[1] - p[1]) / dist(ahead, p)]
    const r = rejoin(DESKTOP, [p[0] - 300 * u[0], p[1] - 300 * u[1]], t - 1 / 60)
    expect(r.seconds).toBeLessThan(WORST.desktop * 1.5) // measured 5.0 s: the path slows after its peak
    expect(r.worstAfter).toBeLessThanOrEqual(DESKTOP.pitch)
  })
})

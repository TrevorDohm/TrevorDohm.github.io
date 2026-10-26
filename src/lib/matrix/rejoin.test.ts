import { describe, expect, it } from 'vitest'
import { idlePeakSpeed, idleQuery } from './idle'
import { createLight, cruiseSpeed, stepLight, type Point } from './query'

// After a release, how long the light takes to rejoin the idle path, over
// every phase of the path and several release points, at 1440x900 and 60 fps.
const W = 1440
const H = 900
const PITCH = 32
const cruise = cruiseSpeed(W, H)
const dt = 1 / 60
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
/** Worst rejoin time allowed (s). The worst found, 13.3 s, is far corner to a path heading away from it. */
const REJOIN_BOUND = 16

/** Release from rest at `from` with the path at time t0; seconds until within 2px, and the gap after. */
function rejoin(from: Point, t0: number): { seconds: number; worstAfter: number } {
  const light = createLight()
  stepLight(light, from, true, dt, cruise, PITCH)
  for (let i = 1; i <= 60 * 30; i++) {
    const q = stepLight(light, idleQuery(t0 + i * dt, W, H), false, dt, cruise, PITCH)
    if (dist(q, idleQuery(t0 + i * dt, W, H)) < 2) {
      let worstAfter = 0
      for (let k = 1; k <= 60 * 10; k++) {
        const t = t0 + (i + k) * dt
        worstAfter = Math.max(worstAfter, dist(stepLight(light, idleQuery(t, W, H), false, dt, cruise, PITCH), idleQuery(t, W, H)))
      }
      return { seconds: i * dt, worstAfter }
    }
  }
  return { seconds: Infinity, worstAfter: Infinity }
}

describe('rejoining the idle path after a release', () => {
  it('is finite and within the bound from every corner and edge, at every phase of the path', () => {
    const from: Point[] = [[20, 80], [1420, 80], [20, 880], [1420, 880], [720, 880], [720, 80]]
    // Measured: median 6.1 s, 90th percentile 8.8 s, worst 13.3 s (from (20, 880) at t0 39, 921px away).
    for (const p of from) {
      for (let t0 = 0; t0 < 120; t0 += 3) {
        const r = rejoin(p, t0)
        expect(r.seconds).toBeLessThan(REJOIN_BOUND)
        expect(r.worstAfter).toBeLessThanOrEqual(PITCH) // then it rides the path within a cell
      }
    }
  })

  it('is finite in the worst case: the path fleeing at its top speed with the light right behind', () => {
    // When the path is at its top speed, put the light at rest 300px behind it, on its line of travel.
    let t = 0
    let best = 0
    for (let s = 0; s < 1200; s += 0.05) {
      const v = dist(idleQuery(s + 0.001, W, H), idleQuery(s, W, H)) / 0.001
      if (v > best) [best, t] = [v, s]
    }
    expect(best).toBeCloseTo(idlePeakSpeed(W, H), 0)
    const p = idleQuery(t, W, H)
    const ahead = idleQuery(t + 0.001, W, H)
    const u = [(ahead[0] - p[0]) / dist(ahead, p), (ahead[1] - p[1]) / dist(ahead, p)]
    const r = rejoin([p[0] - 300 * u[0], p[1] - 300 * u[1]], t - dt)
    // Measured: the path at 153.9 px/s, the light 300px behind, rejoins in 5.0 s.
    expect(r.seconds).toBeLessThan(REJOIN_BOUND)
    expect(r.worstAfter).toBeLessThanOrEqual(PITCH)
  })
})

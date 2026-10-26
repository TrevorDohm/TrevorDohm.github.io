import { describe, expect, it } from 'vitest'
import { idleQuery } from './idle'
import { INTRO_END, introQuery } from './intro'
import { QUERY_MAX_SPEED, QUERY_RATE, queryTarget, smoothQuery } from './query'
import { clearPointer, createState, IDLE_AFTER_MS, setPointer } from './state'

const pitch = 24

describe('smoothQuery', () => {
  it('covers 1 - exp(-rate * dt) of the gap in one step', () => {
    const dt = 1 / 60
    const [x, y] = smoothQuery([0, 0], [30, 40], dt, pitch)
    const k = 1 - Math.exp(-QUERY_RATE * dt)
    expect(x).toBeCloseTo(30 * k, 9)
    expect(y).toBeCloseTo(40 * k, 9)
  })

  it('trails a nearby target the same way at 30, 60 and 144 fps', () => {
    const run = (fps: number) => {
      let q: [number, number] = [0, 0]
      for (let i = 0; i < fps; i++) q = smoothQuery(q, [40, 0], 1 / fps, pitch)
      return q[0]
    }
    const expected = 40 * (1 - Math.exp(-QUERY_RATE)) // one second
    for (const fps of [30, 60, 144]) expect(run(fps)).toBeCloseTo(expected, 6)
  })

  it('glides to a far target at no more than QUERY_MAX_SPEED cells per second', () => {
    for (const fps of [30, 60]) {
      let q: [number, number] = [0, 0]
      for (let i = 0; i < fps / 2; i++) q = smoothQuery(q, [5000, 0], 1 / fps, pitch)
      expect(q[0]).toBeCloseTo((QUERY_MAX_SPEED * pitch) / 2, 6)
    }
  })

  it('never overshoots and stays put with no time or no gap', () => {
    expect(smoothQuery([5, 5], [6, 5], 10, pitch)[0]).toBeLessThanOrEqual(6)
    expect(smoothQuery([5, 5], [100, 5], 0, pitch)).toEqual([5, 5])
    expect(smoothQuery([5, 5], [5, 5], 1 / 60, pitch)).toEqual([5, 5])
  })
})

describe('queryTarget', () => {
  const path = [700, 300] as const

  it('follows the pointer while input is recent, then the path', () => {
    const s = createState()
    expect(queryTarget(s, 0, path)).toEqual(path)
    setPointer(s, 10, 20, 1000)
    expect(queryTarget(s, 1000 + IDLE_AFTER_MS, path)).toEqual([10, 20])
    expect(queryTarget(s, 1000 + IDLE_AFTER_MS + 1, path)).toEqual(path)
  })

  it('returns to the path as soon as the pointer leaves', () => {
    const s = createState()
    setPointer(s, 10, 20, 1000)
    clearPointer(s)
    expect(queryTarget(s, 1001, path)).toEqual(path)
  })
})

describe('query over a scripted visit', () => {
  // A 1366 x 657 hero at 60fps, after the intro: the pointer sweeps in, stops
  // (and goes idle), sweeps again, then leaves. It never jumps more than 10px.
  it('never moves more than half a cell per frame and settles back on the path', () => {
    const width = 1366
    const height = 657
    const centre = [400, 200] as const
    const dt = 1 / 60
    const s = createState()
    let clock = INTRO_END
    let now = 0
    let pointer: [number, number] = [100, 150]
    const path = () => introQuery(clock, centre, idleQuery(clock - 2.5, width, height))
    let q: [number, number] = [...path()]
    let worst = 0
    const trail: number[] = []
    const frame = (move: [number, number] | null) => {
      clock += dt
      now += dt * 1000
      if (move) {
        pointer = [pointer[0] + move[0], pointer[1] + move[1]]
        setPointer(s, pointer[0], pointer[1], now)
      }
      const next = smoothQuery(q, queryTarget(s, now, path()), dt, pitch)
      worst = Math.max(worst, Math.hypot(next[0] - q[0], next[1] - q[1]))
      q = next
      trail.push(Math.hypot(q[0] - pointer[0], q[1] - pointer[1]))
    }
    for (let i = 0; i < 90; i++) frame([10, 2]) // sweep right
    const lagWhileMoving = trail[trail.length - 1]
    for (let i = 0; i < 60; i++) frame(null) // stop for 1 s
    const lagStopped = trail[trail.length - 1]
    for (let i = 0; i < 150; i++) frame(null) // 2.5 s more: idle, back to the path
    for (let i = 0; i < 60; i++) frame([-10, 3]) // sweep left
    clearPointer(s) // leave
    for (let i = 0; i < 240; i++) frame(null)

    expect(lagWhileMoving).toBeGreaterThan(pitch) // the light trails the cursor
    expect(lagStopped).toBeLessThan(pitch * 0.2) // and catches up once it stops
    expect(worst).toBeLessThanOrEqual(pitch * 0.5 + 1e-9)
    const [px, py] = path()
    expect(Math.hypot(q[0] - px, q[1] - py)).toBeLessThan(pitch * 3)
  })
})

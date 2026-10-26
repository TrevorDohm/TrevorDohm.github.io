import { describe, expect, it } from 'vitest'
import { idleQuery } from './idle'
import { INTRO_END, introQuery } from './intro'
import { GLIDE_CELLS, goalAt, isSettled, QUERY_RATE, queryTarget, smoothQuery } from './query'
import { clearPointer, createState, IDLE_AFTER_MS, setPointer } from './state'

const pitch = 24

describe('smoothQuery', () => {
  it('covers 1 - exp(-rate * dt) of the gap in one step, at the mockup rate of 4/s', () => {
    expect(QUERY_RATE).toBe(4)
    const dt = 1 / 60
    const [x, y] = smoothQuery([0, 0], [30, 40], dt)
    const k = 1 - Math.exp(-QUERY_RATE * dt)
    expect(x).toBeCloseTo(30 * k, 9)
    expect(y).toBeCloseTo(40 * k, 9)
  })

  it('trails a nearby target the same way at 30, 60 and 144 fps', () => {
    const run = (fps: number) => {
      let q: [number, number] = [0, 0]
      for (let i = 0; i < fps; i++) q = smoothQuery(q, [40, 0], 1 / fps)
      return q[0]
    }
    const expected = 40 * (1 - Math.exp(-QUERY_RATE)) // one second
    for (const fps of [30, 60, 144]) expect(run(fps)).toBeCloseTo(expected, 6)
  })

  it('has no speed cap: a far target is closed by the same fraction, as the mockup', () => {
    const dt = 1 / 60
    const [x] = smoothQuery([0, 0], [5000, 0], dt)
    expect(x).toBeCloseTo(5000 * (1 - Math.exp(-QUERY_RATE * dt)), 6)
  })

  it('never overshoots and stays put with no time or no gap', () => {
    expect(smoothQuery([5, 5], [6, 5], 10)[0]).toBeLessThanOrEqual(6)
    expect(smoothQuery([5, 5], [100, 5], 0)).toEqual([5, 5])
    expect(smoothQuery([5, 5], [5, 5], 1 / 60)).toEqual([5, 5])
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

describe('goalAt and isSettled', () => {
  const centre = [400, 200] as const
  it('heads for the name centre in the hold, the idle path after the intro, the pointer on input', () => {
    const s = createState()
    expect(goalAt(s, 0, INTRO_END - 1.5, centre, 1366, 657)).toEqual(introQuery(INTRO_END - 1.5, centre, idleQuery(0, 1366, 657)))
    const late = INTRO_END + 4
    expect(goalAt(s, 0, late, centre, 1366, 657)).toEqual(introQuery(late, centre, idleQuery(late - 2.5, 1366, 657)))
    setPointer(s, 10, 20, 100)
    expect(goalAt(s, 200, late, centre, 1366, 657)).toEqual([10, 20])
  })

  it('counts the light as settled within GLIDE_CELLS of its goal', () => {
    expect(isSettled([0, 0], [GLIDE_CELLS * pitch, 0], pitch)).toBe(true)
    expect(isSettled([0, 0], [GLIDE_CELLS * pitch + 1, 0], pitch)).toBe(false)
  })
})

describe('query over a scripted visit', () => {
  const width = 1366
  const height = 657
  const centre = [400, 200] as const
  const dt = 1 / 60
  const k = 1 - Math.exp(-QUERY_RATE * dt) // 6.45% of the gap per 60Hz frame

  // A 1366 x 657 hero at 60fps, after the intro: the pointer sweeps in, stops
  // (and goes idle), sweeps again, then leaves. It moves 10px a frame at most.
  it('never jumps: each frame covers k of the gap, and no more than the pointer once caught up', () => {
    const s = createState()
    let clock = INTRO_END
    let now = 0
    let pointer: [number, number] = [100, 150]
    let q: [number, number] = [...goalAt(s, now, clock, centre, width, height)]
    let worst = 0
    let worstFollowing = 0
    const trail: number[] = []
    const frame = (move: [number, number] | null, following = false) => {
      clock += dt
      now += dt * 1000
      if (move) {
        pointer = [pointer[0] + move[0], pointer[1] + move[1]]
        setPointer(s, pointer[0], pointer[1], now)
      }
      const goal = goalAt(s, now, clock, centre, width, height)
      const gap = Math.hypot(goal[0] - q[0], goal[1] - q[1])
      const next = smoothQuery(q, goal, dt)
      const step = Math.hypot(next[0] - q[0], next[1] - q[1])
      expect(step).toBeLessThanOrEqual(k * gap + 1e-9) // a glide, by construction
      worst = Math.max(worst, step)
      if (following) worstFollowing = Math.max(worstFollowing, step)
      q = next
      trail.push(Math.hypot(q[0] - pointer[0], q[1] - pointer[1]))
    }
    for (let i = 0; i < 90; i++) frame([10, 2], i >= 60) // sweep right; the first second closes the jump-in
    const lagWhileMoving = trail[trail.length - 1]
    for (let i = 0; i < 60; i++) frame(null, true) // stop for 1 s
    const lagStopped = trail[trail.length - 1]
    for (let i = 0; i < 150; i++) frame(null) // 2.5 s more: idle, back to the path
    for (let i = 0; i < 60; i++) frame([-10, 3]) // sweep left
    clearPointer(s) // leave
    for (let i = 0; i < 240; i++) frame(null)

    expect(lagWhileMoving).toBeGreaterThan(pitch) // the light trails the cursor
    expect(lagStopped).toBeLessThan(pitch * 0.2) // and catches up once it stops
    expect(worstFollowing).toBeLessThanOrEqual(Math.hypot(10, 2) + 1e-9) // never faster than the pointer
    expect(worst).toBeLessThanOrEqual(k * Math.hypot(width, height)) // under 98px, 4 cells
    const [px, py] = goalAt(s, now, clock, centre, width, height)
    expect(Math.hypot(q[0] - px, q[1] - py)).toBeLessThan(pitch * 3)
  })

  it('trails a fast 1600 px/s sweep by about v / rate', () => {
    const s = createState()
    let q: [number, number] = [0, 300]
    let x = 0
    for (let i = 0; i < 60; i++) {
      x += 1600 * dt
      setPointer(s, x, 300, i * dt * 1000)
      q = smoothQuery(q, queryTarget(s, i * dt * 1000, [0, 0]), dt)
    }
    const lag = x - q[0]
    expect(Math.abs(lag - 1600 / QUERY_RATE)).toBeLessThan(0.1 * (1600 / QUERY_RATE))
  })
})

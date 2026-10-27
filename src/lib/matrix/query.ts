/**
 * Where the light is centred. Pure. The query never jumps: following the
 * pointer, each frame it moves part of the way toward it, as the mockup does;
 * heading for the idle path, it glides there at the path's own pace.
 */
import { idlePeakSpeed, idleQuery } from './idle'
import { BREAK_AT, introQuery } from './intro'
import { isIdle, type MatrixState } from './state'

export type Point = readonly [x: number, y: number]

/** How quickly the query closes the gap to its target, per second (the mockup's rate). */
export const QUERY_RATE = 4
/** Within this many cells of its goal the light has settled (the loop may drop to 30fps). */
export const GLIDE_CELLS = 3
/** Seconds the light takes to reach its cruise speed from rest when it heads back to the path. */
export const GLIDE_RAMP = 0.3
/**
 * The cruise speed as a multiple of the idle path's actual top speed: the
 * light glides back at about the drift's own pace, yet always gains on it.
 */
export const CRUISE_FACTOR = 1.1

/**
 * One step of the query toward `target`, `dt` seconds long. It covers
 * 1 - exp(-rate * dt) of the gap, so the light trails the cursor the same way
 * at any frame rate: 6.45% of the gap per 60Hz frame, and while it follows a
 * pointer moving s pixels a frame, never more than s.
 */
export function smoothQuery(q: Point, target: Point, dt: number, rate = QUERY_RATE): [number, number] {
  const k = dt > 0 ? 1 - Math.exp(-rate * dt) : 0
  return [q[0] + (target[0] - q[0]) * k, q[1] + (target[1] - q[1]) * k]
}

/** True while the light follows the pointer: there is one and input is recent. */
export function isFollowing(state: MatrixState, now: number): boolean {
  return !!state.pointer && !isIdle(state, now)
}

/** Where the query heads: the pointer while input is recent, otherwise `path`. */
export function queryTarget(state: MatrixState, now: number, path: Point): Point {
  const { pointer } = state
  return pointer && isFollowing(state, now) ? [pointer.x, pointer.y] : path
}

let cruiseFor: number[] = []
let cruiseMemo = 0
/** How fast the light may glide back to the idle path (px/s): CRUISE_FACTOR x its top speed, kept per canvas size. */
export function cruiseSpeed(width: number, height: number, floor = Infinity, ceiling = -Infinity): number {
  const key = [width, height, floor, ceiling]
  if (key.some((v, i) => v !== cruiseFor[i])) {
    cruiseFor = key
    cruiseMemo = CRUISE_FACTOR * idlePeakSpeed(width, height, floor, ceiling)
  }
  return cruiseMemo
}

/**
 * The light: its centre, its velocity (px/s; kept while it follows the
 * pointer too, so a glide can carry it on), the target it last aimed at (for
 * the path's own velocity), and whether it follows the pointer or glides.
 */
export interface Light {
  q: [number, number] | null
  v: [number, number]
  last: [number, number] | null
  following: boolean
  gliding: boolean
}

export function createLight(): Light {
  return { q: null, v: [0, 0], last: null, following: false, gliding: false }
}

/** `v` scaled down to at most `max` long. */
const capped = (v: [number, number], max: number): [number, number] => {
  const m = Math.hypot(v[0], v[1])
  return m > max ? [(v[0] * max) / m, (v[1] * max) / m] : v
}

/**
 * One frame of the light toward `target`, `dt` seconds long. Following the
 * pointer it is `smoothQuery`, the mockup's drag, and so is the intro and its
 * break unless a pointer has steered the light (the approved look). Once it
 * lets go of the pointer (the pointer leaves or goes idle, or focus leaves the
 * hero) it glides until the pointer steers it again. Gliding, it steers its
 * velocity, changing it by at most cruise / GLIDE_RAMP a second, toward the
 * path point's own velocity plus a closing speed: cruise when far, falling in
 * proportion within an approach zone, so it eases onto the path and rides it
 * with no overshoot. The zone is at least a pitch and long enough to brake
 * from cruise at that rate. It never exceeds cruise, and it carries on at its
 * own speed (capped at cruise) when it lets go, so it never stops dead.
 */
export function stepLight(light: Light, target: Point, following: boolean, dt: number, cruise: number, pitch: number): [number, number] {
  const q = light.q
  const last = light.last
  light.last = [target[0], target[1]]
  // Before the zero-length early return, so a release on such a frame (a re-layout) is not lost.
  const released = light.following && !following
  if (released) [light.gliding, light.v] = [true, capped(light.v, cruise)]
  if (following) light.gliding = false
  light.following = following
  if (!q || dt <= 0) return (light.q = q ?? [target[0], target[1]])
  if (!light.gliding) {
    const next = smoothQuery(q, target, dt)
    light.v = [(next[0] - q[0]) / dt, (next[1] - q[1]) / dt]
    return (light.q = next)
  }
  // The path point's velocity (none on the release frame: the target just switched).
  const vt = last && !released ? [(target[0] - last[0]) / dt, (target[1] - last[1]) / dt] : [0, 0]
  const gx = target[0] - q[0]
  const gy = target[1] - q[1]
  const gap = Math.hypot(gx, gy)
  const zone = Math.max(pitch, cruise * GLIDE_RAMP)
  const closing = gap > 0 ? (cruise * Math.min(1, gap / zone)) / gap : 0
  const want = capped([vt[0] + gx * closing, vt[1] + gy * closing], cruise)
  const dv = capped([want[0] - light.v[0], want[1] - light.v[1]], (cruise / GLIDE_RAMP) * dt)
  const v: [number, number] = [light.v[0] + dv[0], light.v[1] + dv[1]]
  // The mean of the frame's start and end velocities: exact for steady acceleration, at any frame rate.
  const next: [number, number] = [q[0] + ((light.v[0] + v[0]) / 2) * dt, q[1] + ((light.v[1] + v[1]) / 2) * dt]
  light.v = v
  return (light.q = next)
}

/**
 * The query's goal at intro clock `clock`: the pointer while input is recent,
 * else the name's centre easing out onto the idle path over the break.
 */
export function goalAt(
  state: MatrixState,
  now: number,
  clock: number,
  centre: Point,
  width: number,
  height: number,
  floor = Infinity,
  ceiling = -Infinity,
): Point {
  const idle = idleQuery(Math.max(0, clock - BREAK_AT), width, height, floor, ceiling)
  return queryTarget(state, now, introQuery(clock, centre, idle))
}

/** True when the light is within GLIDE_CELLS of its goal. */
export function isSettled(q: Point, goal: Point, pitch: number): boolean {
  return Math.hypot(goal[0] - q[0], goal[1] - q[1]) <= GLIDE_CELLS * pitch
}

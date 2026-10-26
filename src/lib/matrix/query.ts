/**
 * Where the light is centred. Pure. The query never jumps: following the
 * pointer, each frame it moves part of the way toward it, as the mockup does;
 * heading for the idle path, it glides there at the path's own pace.
 */
import { idleQuery, idleSpeed } from './idle'
import { BREAK_AT, introQuery } from './intro'
import { isIdle, type MatrixState } from './state'

export type Point = readonly [x: number, y: number]

/** How quickly the query closes the gap to its target, per second (the mockup's rate). */
export const QUERY_RATE = 4
/** Within this many cells of its goal the light has settled (the loop may drop to 30fps). */
export const GLIDE_CELLS = 3
/** Seconds the light takes to reach its cruise speed from rest when it heads back to the path. */
export const GLIDE_RAMP = 0.3
/** The cruise speed as a multiple of the idle path's top speed, so the light always catches up. */
const CRUISE_FACTOR = 1.25

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

/** How fast the light may glide back to the idle path (px/s): CRUISE_FACTOR x the path's top speed. */
export function cruiseSpeed(width: number, height: number, floor = Infinity): number {
  return CRUISE_FACTOR * idleSpeed(width, height, floor)
}

/** The light's centre and how fast it last moved (px/s). */
export interface Light {
  q: [number, number] | null
  speed: number
  following: boolean
}

export function createLight(): Light {
  return { q: null, speed: 0, following: false }
}

/**
 * One frame of the light toward `target`, `dt` seconds long. Following the
 * pointer it is `smoothQuery`, the mockup's drag. Heading for the idle path
 * (after the pointer leaves or goes idle, and in the intro's break) it moves
 * straight at the target no faster than `cruise`, gaining at most
 * cruise / GLIDE_RAMP of speed a second, from rest when it lets go of the
 * pointer; once a step reaches the target it rides the path exactly.
 */
export function stepLight(light: Light, target: Point, following: boolean, dt: number, cruise: number): [number, number] {
  const q = light.q
  if (!q) {
    light.following = following
    return (light.q = [target[0], target[1]])
  }
  let next: [number, number]
  if (following) next = smoothQuery(q, target, dt)
  else {
    if (light.following) light.speed = 0 // let go of the pointer: set off from rest
    const gap = Math.hypot(target[0] - q[0], target[1] - q[1])
    const speed = Math.min(cruise, light.speed + (cruise / GLIDE_RAMP) * dt)
    // The mean of the frame's start and end speeds: exact for steady acceleration, at any frame rate.
    const travel = ((light.speed + speed) / 2) * dt
    if (travel >= gap) {
      next = [target[0], target[1]] // on the path: ride it at its own pace
      if (dt > 0) light.speed = gap / dt
    } else {
      next = [q[0] + ((target[0] - q[0]) * travel) / gap, q[1] + ((target[1] - q[1]) * travel) / gap]
      light.speed = speed
    }
  }
  if (following && dt > 0) light.speed = Math.hypot(next[0] - q[0], next[1] - q[1]) / dt
  light.following = following
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
): Point {
  const idle = idleQuery(Math.max(0, clock - BREAK_AT), width, height, floor)
  return queryTarget(state, now, introQuery(clock, centre, idle))
}

/** True when the light is within GLIDE_CELLS of its goal. */
export function isSettled(q: Point, goal: Point, pitch: number): boolean {
  return Math.hypot(goal[0] - q[0], goal[1] - q[1]) <= GLIDE_CELLS * pitch
}

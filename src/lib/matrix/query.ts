/**
 * Where the light is centred. Pure. The query never jumps: each frame it moves
 * part of the way toward its target, as the mockup does.
 */
import { idleQuery } from './idle'
import { BREAK_AT, introQuery } from './intro'
import { isIdle, type MatrixState } from './state'

export type Point = readonly [x: number, y: number]

/** How quickly the query closes the gap to its target, per second (the mockup's rate). */
export const QUERY_RATE = 4
/** Within this many cells of its goal the light has settled (the loop may drop to 30fps). */
export const GLIDE_CELLS = 3

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

/** Where the query heads: the pointer while input is recent, otherwise `path`. */
export function queryTarget(state: MatrixState, now: number, path: Point): Point {
  const { pointer } = state
  return pointer && !isIdle(state, now) ? [pointer.x, pointer.y] : path
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
): Point {
  const idle = idleQuery(Math.max(0, clock - BREAK_AT), width, height)
  return queryTarget(state, now, introQuery(clock, centre, idle))
}

/** True when the light is within GLIDE_CELLS of its goal. */
export function isSettled(q: Point, goal: Point, pitch: number): boolean {
  return Math.hypot(goal[0] - q[0], goal[1] - q[1]) <= GLIDE_CELLS * pitch
}

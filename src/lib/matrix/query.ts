/**
 * Where the light is centred. Pure. The query never jumps: each frame it moves
 * part of the way toward its target, as the mockup does.
 */
import { isIdle, type MatrixState } from './state'

export type Point = readonly [x: number, y: number]

/** How quickly the query closes the gap to its target, per second (the mockup's rate). */
export const QUERY_RATE = 4
/** Top speed of the query in cells per second: half a cell per 60Hz frame. */
export const QUERY_MAX_SPEED = 30

/**
 * One step of the query toward `target`, `dt` seconds long. It covers
 * 1 - exp(-rate * dt) of the gap, so the light trails the cursor the same way
 * at any frame rate, but never more than `maxSpeed` cells per second, so a far
 * target (the pointer leaving, a button) is a glide, not a jump.
 */
export function smoothQuery(
  q: Point,
  target: Point,
  dt: number,
  pitch: number,
  rate = QUERY_RATE,
  maxSpeed = QUERY_MAX_SPEED,
): [number, number] {
  const dx = target[0] - q[0]
  const dy = target[1] - q[1]
  const gap = Math.hypot(dx, dy)
  if (gap === 0 || dt <= 0) return [q[0], q[1]]
  const step = Math.min(gap * (1 - Math.exp(-rate * dt)), maxSpeed * pitch * dt)
  return [q[0] + (dx / gap) * step, q[1] + (dy / gap) * step]
}

/** Where the query heads: the pointer while input is recent, otherwise `path`. */
export function queryTarget(state: MatrixState, now: number, path: Point): Point {
  const { pointer } = state
  return pointer && !isIdle(state, now) ? [pointer.x, pointer.y] : path
}

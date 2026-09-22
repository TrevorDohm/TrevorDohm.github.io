/** Input state the matrix reads each frame. Times are in milliseconds. */
export interface Ripple {
  x: number
  y: number
  start: number
}

export interface MatrixState {
  /** Where attention is centered, in canvas CSS pixels. */
  query: { x: number; y: number }
  /** True once the visitor has moved the query at least once. */
  hasQuery: boolean
  lastInput: number
  /** Cell under the cursor, or -1. */
  hover: number
  ripples: Ripple[]
}

export const IDLE_AFTER_MS = 2000
export const MAX_RIPPLES = 6

export function createState(): MatrixState {
  return { query: { x: 0, y: 0 }, hasQuery: false, lastInput: -Infinity, hover: -1, ripples: [] }
}

export function isIdle(state: MatrixState, now: number): boolean {
  return now - state.lastInput > IDLE_AFTER_MS
}

export function setQuery(state: MatrixState, x: number, y: number, now: number): void {
  state.query.x = x
  state.query.y = y
  state.hasQuery = true
  state.lastInput = now
}

export function addRipple(state: MatrixState, x: number, y: number, now: number): void {
  state.ripples.push({ x, y, start: now })
  if (state.ripples.length > MAX_RIPPLES) state.ripples.shift()
}

export function pruneRipples(state: MatrixState, now: number, lifetimeMs: number): void {
  state.ripples = state.ripples.filter((r) => now - r.start < lifetimeMs)
}

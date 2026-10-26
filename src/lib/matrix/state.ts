/** Input state the matrix reads each frame. Times are in milliseconds. */
export interface Ripple {
  x: number
  y: number
  start: number
}

export interface MatrixState {
  /** Where the visitor last pointed, in canvas CSS pixels, or null once they leave. */
  pointer: { x: number; y: number } | null
  lastInput: number
  ripples: Ripple[]
}

/** Input this old stops steering the light (the mockup's threshold). */
export const IDLE_AFTER_MS = 2500
export const MAX_RIPPLES = 6

export function createState(): MatrixState {
  return { pointer: null, lastInput: -Infinity, ripples: [] }
}

/** True when nothing steers the light: no pointer, or no input for IDLE_AFTER_MS. */
export function isIdle(state: MatrixState, now: number): boolean {
  return !state.pointer || now - state.lastInput > IDLE_AFTER_MS
}

export function setPointer(state: MatrixState, x: number, y: number, now: number): void {
  state.pointer = { x, y }
  state.lastInput = now
}

export function clearPointer(state: MatrixState): void {
  state.pointer = null
}

export function addRipple(state: MatrixState, x: number, y: number, now: number): void {
  state.ripples.push({ x, y, start: now })
  if (state.ripples.length > MAX_RIPPLES) state.ripples.shift()
}

export function pruneRipples(state: MatrixState, now: number, lifetimeMs: number): void {
  state.ripples = state.ripples.filter((r) => now - r.start < lifetimeMs)
}

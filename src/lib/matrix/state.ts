/** Input state the matrix reads each frame. Times are in milliseconds. */
export interface Ripple {
  x: number
  y: number
  start: number
}

export interface MatrixState {
  /** Where the visitor last pointed, in canvas CSS pixels, or null once they leave. */
  pointer: { x: number; y: number } | null
  /** True while the pointer rests on (or focus is in) a hero link or button. */
  held: boolean
  lastInput: number
  ripples: Ripple[]
}

/** Input this old stops steering the light (the mockup's threshold). */
export const IDLE_AFTER_MS = 2500
export const MAX_RIPPLES = 6

export function createState(): MatrixState {
  return { pointer: null, held: false, lastInput: -Infinity, ripples: [] }
}

/** True when nothing steers the light: no pointer, or no input for IDLE_AFTER_MS and not held. */
export function isIdle(state: MatrixState, now: number): boolean {
  return !state.pointer || (!state.held && now - state.lastInput > IDLE_AFTER_MS)
}

export function setPointer(state: MatrixState, x: number, y: number, now: number): void {
  state.pointer = { x, y }
  state.held = false
  state.lastInput = now
}

/** Points at a hero link or button: the light stays there until released. */
export function holdPointer(state: MatrixState, x: number, y: number, now: number): void {
  setPointer(state, x, y, now)
  state.held = true
}

export function clearPointer(state: MatrixState): void {
  state.pointer = null
  state.held = false
}

export function addRipple(state: MatrixState, x: number, y: number, now: number): void {
  state.ripples.push({ x, y, start: now })
  if (state.ripples.length > MAX_RIPPLES) state.ripples.shift()
}

export function pruneRipples(state: MatrixState, now: number, lifetimeMs: number): void {
  state.ripples = state.ripples.filter((r) => now - r.start < lifetimeMs)
}

import { describe, expect, it, vi } from 'vitest'
import { whileMotionAllowed } from './while-motion-allowed'

/** A stand-in for the reduced-motion MediaQueryList that tests can flip. */
function fakeQuery(matches: boolean) {
  const listeners = new Set<() => void>()
  return {
    matches,
    listeners,
    addEventListener: (_: 'change', fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: 'change', fn: () => void) => void listeners.delete(fn),
    set(value: boolean) {
      this.matches = value
      listeners.forEach((fn) => fn())
    },
  }
}

describe('whileMotionAllowed', () => {
  it('starts at once when motion is allowed', () => {
    const start = vi.fn(() => () => {})
    whileMotionAllowed(start, fakeQuery(false))
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('does not start under reduced motion', () => {
    const start = vi.fn(() => () => {})
    whileMotionAllowed(start, fakeQuery(true))
    expect(start).not.toHaveBeenCalled()
  })

  it('stops when reduced motion turns on and starts again when it turns off', () => {
    const stop = vi.fn()
    const start = vi.fn(() => stop)
    const query = fakeQuery(false)
    whileMotionAllowed(start, query)
    query.set(true)
    expect(stop).toHaveBeenCalledTimes(1)
    query.set(false)
    expect(start).toHaveBeenCalledTimes(2)
  })

  it('ignores a change event that leaves the setting where it was', () => {
    const stop = vi.fn()
    const start = vi.fn(() => stop)
    const query = fakeQuery(false)
    whileMotionAllowed(start, query)
    query.set(false)
    expect(start).toHaveBeenCalledTimes(1)
    expect(stop).not.toHaveBeenCalled()
  })

  it('returns a cleanup that stops the behavior and stops listening', () => {
    const stop = vi.fn()
    const start = vi.fn(() => stop)
    const query = fakeQuery(false)
    whileMotionAllowed(start, query)()
    expect(stop).toHaveBeenCalledTimes(1)
    expect(query.listeners.size).toBe(0)
    query.set(true)
    query.set(false)
    expect(start).toHaveBeenCalledTimes(1)
  })
})

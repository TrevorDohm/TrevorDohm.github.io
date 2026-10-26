import { describe, expect, it } from 'vitest'
import { IDLE_AFTER_MS, MAX_RIPPLES, addRipple, clearPointer, createState, holdPointer, isIdle, pruneRipples, setPointer } from './state'

describe('matrix state', () => {
  it('starts idle, with no pointer or ripples', () => {
    const s = createState()
    expect(s.pointer).toBeNull()
    expect(s.ripples).toEqual([])
    expect(isIdle(s, 0)).toBe(true)
  })

  it('is active right after input and idle 2.5 s later, as the mockup', () => {
    expect(IDLE_AFTER_MS).toBe(2500)
    const s = createState()
    setPointer(s, 10, 20, 1000)
    expect(s.pointer).toEqual({ x: 10, y: 20 })
    expect(isIdle(s, 1000 + IDLE_AFTER_MS)).toBe(false)
    expect(isIdle(s, 1000 + IDLE_AFTER_MS + 1)).toBe(true)
  })

  it('is idle at once when the pointer leaves', () => {
    const s = createState()
    setPointer(s, 10, 20, 1000)
    clearPointer(s)
    expect(s.pointer).toBeNull()
    expect(isIdle(s, 1001)).toBe(true)
  })

  it('never goes idle while held on a button, and lets go when released or moved', () => {
    const s = createState()
    holdPointer(s, 50, 60, 1000)
    expect(s.pointer).toEqual({ x: 50, y: 60 })
    expect(isIdle(s, 1000 + 60_000)).toBe(false)
    setPointer(s, 10, 20, 2000) // moved off the button
    expect(isIdle(s, 2000 + IDLE_AFTER_MS + 1)).toBe(true)
    holdPointer(s, 50, 60, 3000)
    clearPointer(s) // left the hero, or focus left it
    expect(isIdle(s, 3001)).toBe(true)
  })

  it('keeps at most MAX_RIPPLES, dropping the oldest', () => {
    const s = createState()
    for (let i = 0; i < MAX_RIPPLES + 2; i++) addRipple(s, i, 0, i)
    expect(s.ripples.length).toBe(MAX_RIPPLES)
    expect(s.ripples[0].start).toBe(2)
  })

  it('prunes ripples older than their lifetime', () => {
    const s = createState()
    addRipple(s, 0, 0, 0)
    addRipple(s, 0, 0, 500)
    pruneRipples(s, 1200, 1000)
    expect(s.ripples.map((r) => r.start)).toEqual([500])
  })
})

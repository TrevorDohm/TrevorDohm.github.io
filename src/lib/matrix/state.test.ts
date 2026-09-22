import { describe, expect, it } from 'vitest'
import { IDLE_AFTER_MS, MAX_RIPPLES, addRipple, createState, isIdle, pruneRipples, setQuery } from './state'

describe('matrix state', () => {
  it('starts idle, with no query, hover, or ripples', () => {
    const s = createState()
    expect(s.hasQuery).toBe(false)
    expect(s.hover).toBe(-1)
    expect(s.ripples).toEqual([])
    expect(isIdle(s, 0)).toBe(true)
  })

  it('is active right after input and idle once IDLE_AFTER_MS has passed', () => {
    const s = createState()
    setQuery(s, 10, 20, 1000)
    expect(s.query).toEqual({ x: 10, y: 20 })
    expect(s.hasQuery).toBe(true)
    expect(isIdle(s, 1000 + IDLE_AFTER_MS)).toBe(false)
    expect(isIdle(s, 1000 + IDLE_AFTER_MS + 1)).toBe(true)
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

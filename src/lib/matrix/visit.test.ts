import { describe, expect, it } from 'vitest'
import { BREAK_AT, INTRO_START, introStart, STILL_AT } from './intro'
import { introPlan, seenBy } from './visit'

describe('introPlan', () => {
  it('plays the full intro from dark on a first visit', () => {
    expect(introPlan({ still: false, shown: false, seen: false })).toEqual({ clock: INTRO_START, copyNow: false })
  })

  it('starts lit in the hold, copy showing, on a repeat visit', () => {
    expect(introPlan({ still: false, shown: false, seen: true })).toEqual({ clock: introStart(true), copyNow: true })
  })

  it('starts lit when the safety net already showed the name, copy on its cue', () => {
    expect(introPlan({ still: false, shown: true, seen: false })).toEqual({ clock: introStart(true), copyNow: false })
  })

  it('holds the still frame under reduced motion, seen or not', () => {
    expect(introPlan({ still: true, shown: false, seen: false }).clock).toBe(STILL_AT)
    expect(introPlan({ still: true, shown: true, seen: true }).clock).toBe(STILL_AT)
  })
})

describe('seenBy', () => {
  it('counts the intro as seen once the name starts to break', () => {
    expect(seenBy(BREAK_AT - 0.01)).toBe(false)
    expect(seenBy(BREAK_AT)).toBe(true)
  })
})

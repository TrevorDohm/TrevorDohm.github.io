import { describe, expect, it } from 'vitest'
import { coversHero } from './coverage'

describe('coversHero', () => {
  const hero = { top: -300, bottom: 544 }

  it('is true for a canvas inset 0 on the hero, within rounding', () => {
    expect(coversHero(hero, { top: -300, bottom: 544 })).toBe(true)
    expect(coversHero(hero, { top: -299.6, bottom: 543.6 })).toBe(true)
    expect(coversHero(hero, { top: -1144, bottom: 544 })).toBe(true) // reaching above is fine
  })

  it('is false when the canvas does not cover the hero', () => {
    expect(coversHero(hero, { top: 544, bottom: 544 })).toBe(false) // collapsed to 0 height at the bottom
    expect(coversHero(hero, { top: -290, bottom: 544 })).toBe(false) // starts below the hero's top
    expect(coversHero(hero, { top: -300, bottom: 300 })).toBe(false) // ends above the hero's bottom
    expect(coversHero(hero, { top: -300, bottom: -300 })).toBe(false)
  })
})

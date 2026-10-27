import { describe, expect, it } from 'vitest'
import { bleedGrid, bleedOffset, bleedTargets, showBleed } from './bleed'
import { introAlpha } from './effects'
import { layoutGrid } from './geometry'
import { GLOW_PEAK, WAVE_SECONDS, WAVE_START } from './intro'

describe('bleedGrid', () => {
  const hero = layoutGrid(390, 844, 22, 24, 300) // originY = 300 - 14 * 22 = -8

  it('adds the fewest rows that reach the bleed top, on the hero lattice', () => {
    const b = bleedGrid(hero, 422)
    expect(b.rows).toBe(Math.ceil((422 - 8) / 22)) // 19
    expect(b.originY).toBeCloseTo(hero.originY - b.rows * 22)
    expect(b.originY).toBeLessThanOrEqual(-422)
    expect(b.originY).toBeGreaterThan(-422 - 22)
    expect(b.originY + b.rows * b.pitch).toBeCloseTo(hero.originY) // ends where the hero grid starts
  })

  it('keeps the columns, pitch and cell size, with centres one pitch apart', () => {
    const b = bleedGrid(hero, 422)
    expect([b.cols, b.originX, b.pitch, b.cell]).toEqual([hero.cols, hero.originX, hero.pitch, hero.cell])
    expect(b.centers.length).toBe(b.cols * b.rows * 2)
    // Last bleed row's centre sits one pitch above the hero's first row.
    const last = (b.rows - 1) * b.cols * 2
    expect(b.centers[last + 1]).toBeCloseTo(hero.centers[1] - 22)
    expect(b.centers[last]).toBeCloseTo(hero.centers[0])
  })

  it('has no rows without a bleed', () => {
    const b = bleedGrid(hero, 0)
    expect(b.rows).toBe(0)
    expect(b.centers.length).toBe(0)
  })
})

describe('bleedTargets', () => {
  const hero = layoutGrid(200, 400, 40, 0, 0)
  const b = bleedGrid(hero, 120)
  const attention = Float32Array.from({ length: b.cols * b.rows }, (_, i) => (i + 1) / (b.cols * b.rows))

  it('is the glow peak times the attention once the wave is in', () => {
    const out = bleedTargets(new Float32Array(attention.length), attention, b, hero.rows, WAVE_START + WAVE_SECONDS)
    attention.forEach((a, i) => expect(out[i]).toBeCloseTo(GLOW_PEAK * a))
  })

  it('follows the hero top row of its column during the wave, and is dark before it', () => {
    const t = WAVE_START + 0.4 * WAVE_SECONDS
    const out = bleedTargets(new Float32Array(attention.length), attention, b, hero.rows, t)
    for (let i = 0; i < out.length; i++) {
      const alpha = introAlpha(0.4, 0, i % b.cols, hero.rows, hero.cols)
      expect(out[i]).toBeCloseTo(GLOW_PEAK * attention[i] * alpha)
    }
    const dark = bleedTargets(new Float32Array(attention.length), attention, b, hero.rows, WAVE_START - 0.1)
    expect([...dark].every((v) => v === 0)).toBe(true)
  })
})

describe('showBleed', () => {
  it('draws the bleed only during the top overscroll, or always for a still frame', () => {
    expect(showBleed(-1, false)).toBe(true)
    expect(showBleed(-0.5, false)).toBe(true)
    expect(showBleed(0, false)).toBe(false)
    expect(showBleed(500, false)).toBe(false)
    expect(showBleed(500, true)).toBe(true)
  })
})

describe('bleedOffset', () => {
  it('is how far the canvas starts above the hero, never negative', () => {
    expect(bleedOffset(0, -422)).toBe(422)
    expect(bleedOffset(-300, -722)).toBe(422)
    expect(bleedOffset(10, 10)).toBe(0)
    expect(bleedOffset(10, 20)).toBe(0)
  })
})

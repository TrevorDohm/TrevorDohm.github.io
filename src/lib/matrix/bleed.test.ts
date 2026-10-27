import { describe, expect, it } from 'vitest'
import { bleedGrid, bleedTargets, litRows, measuredBleed, REST, settleRest } from './bleed'
import { attentionWeights } from './attention'
import { introAlpha } from './effects'
import { layoutGrid } from './geometry'
import { GLOW_PEAK, WAVE_SECONDS, WAVE_START } from './intro'

describe('measuredBleed', () => {
  const hero = { top: -300, bottom: 544 }

  it('is how far the canvas starts above the hero', () => {
    expect(measuredBleed(hero, { top: -1144, bottom: 544 })).toBe(844)
  })

  it('is 0 when the canvas is inset 0 on the hero (no bleed CSS)', () => {
    expect(measuredBleed(hero, { top: -300, bottom: 544 })).toBe(0)
    expect(measuredBleed(hero, { top: -299.6, bottom: 543.6 })).toBeCloseTo(-0.4) // rounding slack
  })

  it('is not measurable when the canvas does not cover the hero', () => {
    expect(measuredBleed(hero, { top: 544, bottom: 544 })).toBeNull() // collapsed to 0 height at the bottom
    expect(measuredBleed(hero, { top: -290, bottom: 544 })).toBeNull() // starts below the hero's top
    expect(measuredBleed(hero, { top: -1144, bottom: 300 })).toBeNull() // ends above the hero's bottom
    expect(measuredBleed(hero, { top: -300, bottom: -300 })).toBeNull()
  })
})

describe('bleedGrid', () => {
  const hero = layoutGrid(390, 844, 22, 24, 300) // originY = 300 - 14 * 22 = -8

  it('adds the fewest rows that reach the bleed top, on the hero lattice', () => {
    const b = bleedGrid(hero, 844)
    expect(b.rows).toBe(Math.ceil((844 - 8) / 22)) // 38
    expect(b.originY).toBeCloseTo(hero.originY - b.rows * 22)
    expect(b.originY).toBeLessThanOrEqual(-844)
    expect(b.originY).toBeGreaterThan(-844 - 22)
    expect(b.originY + b.rows * b.pitch).toBeCloseTo(hero.originY) // ends where the hero grid starts
  })

  it('keeps the columns, pitch and cell size, with centres one pitch apart', () => {
    const b = bleedGrid(hero, 844)
    expect([b.cols, b.originX, b.pitch, b.cell]).toEqual([hero.cols, hero.originX, hero.pitch, hero.cell])
    expect(b.centers.length).toBe(b.cols * b.rows * 2)
    const last = (b.rows - 1) * b.cols * 2
    expect(b.centers[last + 1]).toBeCloseTo(hero.centers[1] - 22)
    expect(b.centers[last]).toBeCloseTo(hero.centers[0])
  })

  it('has no rows when the measured bleed is 0, at every lattice offset', () => {
    for (let originY = -21.9; originY <= 0; originY += 0.7) {
      const b = bleedGrid({ ...hero, originY }, measuredBleed({ top: 0, bottom: 844 }, { top: 0, bottom: 844 }) ?? NaN)
      expect(b.rows).toBe(0)
      expect(b.centers.length).toBe(0)
    }
  })
})

describe('litRows', () => {
  const hero = layoutGrid(390, 844, 22, 24, 300)
  const b = bleedGrid(hero, 844)
  const T = 2.2

  it('covers every row the light can lift to REST, and nothing it cannot', () => {
    for (const qy of [-900, -500, -100, -8, 0, 150, 260, 400]) {
      const [first, last] = litRows(b, qy, T)
      const att = attentionWeights(b.centers, b.pitch, 200, qy, T, new Float32Array(b.cols * b.rows))
      for (let row = 0; row < b.rows; row++) {
        // Directly under the light (dx = 0 is the closest any cell can be: use col nearest x = 200).
        const peak = Math.max(...att.subarray(row * b.cols, (row + 1) * b.cols)) * GLOW_PEAK
        if (row < first || row >= last) expect(peak).toBeLessThan(REST)
      }
      if (first < last) expect(Math.max(...att.subarray((last - 1) * b.cols, last * b.cols)) * GLOW_PEAK).toBeGreaterThan(REST * 0.3)
    }
  })

  it('is empty once the light is far below the bleed', () => {
    expect(litRows(b, 400, T)).toEqual([0, 0])
    expect(litRows(b, -100, T)[1]).toBe(b.rows)
  })
})

describe('bleedTargets', () => {
  const hero = layoutGrid(200, 400, 40, 0, 0)
  const b = bleedGrid(hero, 200)
  const all: [number, number] = [0, b.rows]
  const attention = Float32Array.from({ length: b.cols * b.rows }, (_, i) => (i + 1) / (b.cols * b.rows))

  it('is the glow peak times the attention once the wave is in', () => {
    const out = bleedTargets(new Float32Array(attention.length), attention, b, hero.rows, WAVE_START + WAVE_SECONDS, all)
    attention.forEach((a, i) => expect(out[i]).toBeCloseTo(GLOW_PEAK * a))
  })

  it('follows the hero top row of its column during the wave, and is dark before it', () => {
    const t = WAVE_START + 0.4 * WAVE_SECONDS
    const out = bleedTargets(new Float32Array(attention.length), attention, b, hero.rows, t, all)
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBeCloseTo(GLOW_PEAK * attention[i] * introAlpha(0.4, 0, i % b.cols, hero.rows, hero.cols))
    }
    const dark = bleedTargets(new Float32Array(attention.length), attention, b, hero.rows, WAVE_START - 0.1, all)
    expect([...dark].every((v) => v === 0)).toBe(true)
  })

  it('is 0 outside the lit rows, including stale values', () => {
    const out = new Float32Array(attention.length).fill(0.7)
    bleedTargets(out, attention, b, hero.rows, 99, [2, 4])
    for (let i = 0; i < out.length; i++) {
      const row = Math.floor(i / b.cols)
      if (row < 2 || row >= 4) expect(out[i]).toBe(0)
      else expect(out[i]).toBeCloseTo(GLOW_PEAK * attention[i])
    }
  })
})

describe('settleRest', () => {
  it('zeroes weights under REST and keeps the rest', () => {
    expect([...settleRest(Float32Array.from([0, REST / 2, REST * 1.01, 0.3]))]).toEqual([0, 0, Math.fround(REST * 1.01), Math.fround(0.3)])
  })
})

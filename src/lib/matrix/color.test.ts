import { describe, expect, it } from 'vitest'
import { RAMP_SPLIT, mix, parseHex, rampColor, type Rgb } from './color'

describe('parseHex', () => {
  it('parses six-digit hex with surrounding whitespace, as CSS variables return it', () => {
    expect(parseHex(' #7c9cff ')).toEqual([124, 156, 255])
  })

  it('parses three-digit hex', () => {
    expect(parseHex('#fa0')).toEqual([255, 170, 0])
  })

  it('throws on values that are not hex colors', () => {
    expect(() => parseHex('')).toThrow()
    expect(() => parseHex('rgb(1, 2, 3)')).toThrow()
    expect(() => parseHex('#12345')).toThrow()
  })
})

describe('mix', () => {
  const black: Rgb = [0, 0, 0]
  const white: Rgb = [255, 255, 255]

  it('returns the endpoints at 0 and 1 and rounds in between', () => {
    expect(mix(black, white, 0)).toEqual([0, 0, 0])
    expect(mix(black, white, 1)).toEqual([255, 255, 255])
    expect(mix(black, white, 0.5)).toEqual([128, 128, 128])
  })

  it('clamps t outside [0, 1]', () => {
    expect(mix(black, white, -1)).toEqual([0, 0, 0])
    expect(mix(black, white, 2)).toEqual([255, 255, 255])
  })
})

describe('rampColor', () => {
  const line: Rgb = [30, 30, 42]
  const accent: Rgb = [124, 156, 255]
  const accent2: Rgb = [177, 140, 255]

  it('runs line → accent → accent-2 as the weight rises', () => {
    expect(rampColor(0, line, accent, accent2)).toEqual(line)
    expect(rampColor(RAMP_SPLIT, line, accent, accent2)).toEqual(accent)
    expect(rampColor(1, line, accent, accent2)).toEqual(accent2)
  })

  it('blends halfway between line and accent at half the split', () => {
    expect(rampColor(RAMP_SPLIT / 2, line, accent, accent2)).toEqual(mix(line, accent, 0.5))
  })

  it('clamps weights outside [0, 1]', () => {
    expect(rampColor(-1, line, accent, accent2)).toEqual(line)
    expect(rampColor(5, line, accent, accent2)).toEqual(accent2)
  })
})

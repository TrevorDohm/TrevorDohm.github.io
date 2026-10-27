import { describe, expect, it } from 'vitest'
import { cssToken } from './css-token'

const css = `@theme {
  --color-background: #07070b;
  --color-background-2: #111111;
  --color-surface:#0f0f16 ;
}`

describe('cssToken', () => {
  it('reads a custom property value', () => expect(cssToken(css, '--color-background')).toBe('#07070b'))
  it('does not match a longer name that starts the same', () =>
    expect(cssToken(css, '--color-background-2')).toBe('#111111'))
  it('trims whitespace', () => expect(cssToken(css, '--color-surface')).toBe('#0f0f16'))
  it('throws for a missing token, so a rename fails the build', () =>
    expect(() => cssToken(css, '--color-nope')).toThrow(/--color-nope/))
})

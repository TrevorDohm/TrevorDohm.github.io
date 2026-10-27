import { describe, expect, it } from 'vitest'
import { frameGeometry, levelPaths, num } from './frame'
import { cellRect } from './geometry'

/** Grid points of each subpath in a path built by levelPaths. */
function cellsOf(d: string): [number, number][] {
  const out: [number, number][] = []
  let x = 0, y = 0
  for (const [, cmd, a, b] of d.matchAll(/([Mm])(-?\d+) (-?\d+)/g)) {
    x = cmd === 'M' ? Number(a) : x + Number(a)
    y = cmd === 'M' ? Number(b) : y + Number(b)
    out.push([y, x])
  }
  return out
}

describe('frameGeometry', () => {
  it('reproduces every cellRect: outer edge, width and corner radius', () => {
    const g = frameGeometry(12, 424)
    for (const [i, j] of [[0, 0], [5, 7], [11, 11]]) {
      const c = cellRect(i, j, 12, 424)
      expect(g.offset + j * g.scale - (g.stroke * g.scale) / 2).toBeCloseTo(c.x, 9)
      expect(g.offset + i * g.scale - (g.stroke * g.scale) / 2).toBeCloseTo(c.y, 9)
      expect((g.side + g.stroke) * g.scale).toBeCloseTo(c.w, 9)
      expect((g.stroke * g.scale) / 2).toBeCloseTo(c.r, 9)
    }
  })

  it('matches the hand-derived values at 424px', () => {
    const g = frameGeometry(12, 424)
    expect(num(g.offset)).toBe('17.693')
    expect(num(g.scale)).toBe('33.667')
    expect(num(g.side)).toBe('.543')
    expect(num(g.stroke)).toBe('.297')
  })
})

describe('num', () => {
  it('drops leading and trailing zeros', () => {
    expect(num(0.5)).toBe('.5')
    expect(num(-0.25)).toBe('-.25')
    expect(num(3)).toBe('3')
    expect(num(1.23456)).toBe('1.235')
  })
})

describe('levelPaths', () => {
  it('puts every cell in exactly the path of its quantized level', () => {
    const n = 4
    const w = Float32Array.from({ length: n * n }, (_, k) => (k * 7) % 11 / 10)
    const paths = levelPaths(w, n, 11, 0.5)
    expect(paths).toHaveLength(11)
    const seen = new Set<string>()
    paths.forEach((d, level) => {
      for (const [i, j] of cellsOf(d)) {
        expect(Math.round(w[i * n + j] * 10)).toBe(level)
        seen.add(`${i},${j}`)
      }
    })
    expect(seen.size).toBe(n * n)
  })

  it('leaves unused levels empty and clamps weights to the top level', () => {
    const paths = levelPaths(Float32Array.from([0, 0, 2, 1]), 2, 11, 0.5)
    expect(paths[0]).toBe('M0 0h.5v.5h-.5zm1 0h.5v.5h-.5z')
    expect(paths[10]).toBe('M0 1h.5v.5h-.5zm1 0h.5v.5h-.5z')
    expect(paths.slice(1, 10).every((d) => d === '')).toBe(true)
  })
})

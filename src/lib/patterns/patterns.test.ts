import { describe, expect, it } from 'vitest'
import { SWEEP_FLOOR, hash2, patternWeights, sweepWeights, type PatternId } from './patterns'

const N = 12
const IDS: PatternId[] = ['full', 'causal', 'window', 'sparse', 'cosine', 'induction']
const W = (id: PatternId) => patternWeights(id, N)

describe('hash2', () => {
  it('is deterministic and in [0, 1)', () => {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const v = hash2(i, j)
        expect(hash2(i, j)).toBe(v)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    }
  })
})

describe('patternWeights', () => {
  it('gives every row a max of exactly 1, and every pattern has non-zero entries', () => {
    // No pattern here has a legitimately empty row at n = 12, so no all-zero allowance.
    for (const id of IDS) {
      const w = W(id)
      expect(w).toHaveLength(N * N)
      expect(w.some((v) => v > 0), `${id} is all zero`).toBe(true)
      for (let i = 0; i < N; i++) {
        expect(Math.max(...w.subarray(i * N, (i + 1) * N)), `${id} row ${i}`).toBe(1)
      }
    }
  })

  it('is deterministic', () => {
    for (const id of IDS) expect(W(id)).toEqual(W(id))
  })

  it('causal is zero above the diagonal', () => {
    const w = W('causal')
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) expect(w[i * N + j]).toBe(0)
  })

  it('window is zero beyond distance 2', () => {
    const w = W('window')
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) if (Math.abs(i - j) > 2) expect(w[i * N + j]).toBe(0)
  })

  it('sparse keeps row 0 and column 0 global', () => {
    const w = W('sparse')
    for (let k = 0; k < N; k++) {
      expect(w[k]).toBeGreaterThan(0)
      expect(w[k * N]).toBeGreaterThan(0)
    }
  })

  it('full peaks on the diagonal', () => {
    const w = W('full')
    for (let i = 0; i < N; i++) expect(w[i * N + i]).toBe(1)
  })

  it('induction peaks 4 back from the diagonal', () => {
    const w = W('induction')
    for (let i = 4; i < N; i++) {
      const row = Array.from(w.subarray(i * N, (i + 1) * N))
      expect(row.indexOf(Math.max(...row))).toBe(i - 4)
    }
  })

  it('full decays away from the diagonal', () => {
    const w = W('full')
    for (let i = 0; i < N - 4; i++) expect(w[i * N + i + 1]).toBeGreaterThan(w[i * N + i + 4])
  })

  it('causal decays below the diagonal', () => {
    const w = W('causal')
    for (let i = 4; i < N; i++) expect(w[i * N + i]).toBeGreaterThan(w[i * N + i - 4])
  })

  it('sparse has a local band and random links outside the band and global lines', () => {
    const w = W('sparse')
    for (let i = 1; i < N; i++) {
      for (let j = 1; j < N; j++) if (Math.abs(i - j) <= 1) expect(w[i * N + j]).toBeGreaterThan(0)
    }
    let links = 0
    for (let i = 1; i < N; i++)
      for (let j = 1; j < N; j++) if (Math.abs(i - j) > 1 && w[i * N + j] > 0) links++
    expect(links).toBeGreaterThan(0)
  })

  it('induction has a faint diagonal below its peak', () => {
    const w = W('induction')
    for (let i = 4; i < N; i++) {
      expect(w[i * N + i]).toBeGreaterThan(0)
      expect(w[i * N + i]).toBeLessThan(w[i * N + i - 4])
    }
  })

  describe('cosine is smooth and broad', () => {
    const w = W('cosine')
    it('peaks on the diagonal in every row', () => {
      for (let i = 0; i < N; i++) expect(w[i * N + i]).toBe(1)
    })
    it('never drops below 0.2 after normalization', () => {
      for (const v of w) expect(v).toBeGreaterThanOrEqual(0.2)
    })
    it('changes by at most 0.25 between adjacent cells in a row', () => {
      for (let i = 0; i < N; i++)
        for (let j = 1; j < N; j++)
          expect(Math.abs(w[i * N + j] - w[i * N + j - 1])).toBeLessThanOrEqual(0.25)
    })
    it('is broader than full attention', () => {
      const f = W('full')
      const sum = (a: Float32Array) => a.reduce((x, y) => x + y, 0)
      expect(sum(w)).toBeGreaterThan(sum(f))
    })
  })
})

describe('sweepWeights', () => {
  it('keeps the query row at full weight and dims far rows to the floor', () => {
    const base = W('full')
    const out = sweepWeights(base, N, 6.5, new Float32Array(N * N))
    expect(out[6 * N + 6]).toBeCloseTo(base[6 * N + 6])
    expect(out[0]).toBeCloseTo(base[0] * SWEEP_FLOOR)
  })
})

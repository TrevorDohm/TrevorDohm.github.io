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
  it('gives every row a max of 1, or an all-zero row', () => {
    for (const id of IDS) {
      const w = W(id)
      expect(w).toHaveLength(N * N)
      for (let i = 0; i < N; i++) {
        const max = Math.max(...w.subarray(i * N, (i + 1) * N))
        expect(max === 1 || max === 0, `${id} row ${i} max ${max}`).toBe(true)
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

  it('cosine is non-negative everywhere', () => {
    for (const v of W('cosine')) expect(v).toBeGreaterThanOrEqual(0)
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

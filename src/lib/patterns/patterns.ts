export type PatternId = 'full' | 'causal' | 'window' | 'sparse' | 'cosine' | 'induction'

/** Rows farther than this from the query row sit at this fraction of their weight. */
export const SWEEP_FLOOR = 0.28
/** Distance in rows over which the sweep highlight falls off to the floor. */
export const SWEEP_SPREAD = 1.2

/** Deterministic noise in [0, 1) from integer mixing, identical in every JS engine. */
export function hash2(i: number, j: number): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

type Weight = (i: number, j: number) => number

const FORMULAS: Record<PatternId, Weight> = {
  full: (i, j) => Math.exp(-Math.abs(i - j) / 2.2) + 0.25 * hash2(i, j),
  causal: (i, j) => (j <= i ? Math.exp(-(i - j) / 3) + 0.2 * hash2(i, j) : 0),
  window: (i, j) => (Math.abs(i - j) <= 2 ? 1 - Math.abs(i - j) * 0.25 : 0),
  sparse: (i, j) =>
    j === 0 || i === 0 ? 0.9 : Math.abs(i - j) <= 1 ? 0.8 : hash2(i, j) > 0.86 ? 0.6 : 0,
  // Raised cosine over the offset: smooth, broad, always peaked on the diagonal, never negative.
  cosine: (i, j) => 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(((i - j) * Math.PI) / 12)),
  induction: (i, j) => (i - j === 4 ? 1 : 0) + (i === j ? 0.25 : 0) + 0.08 * hash2(i, j),
}

/** n x n attention weights, row-major, each row divided by its own max (zero rows stay zero). */
export function patternWeights(id: PatternId, n: number): Float32Array {
  const f = FORMULAS[id]
  const out = new Float32Array(n * n)
  const row = new Float64Array(n) // normalize in f64 so the row max lands on exactly 1
  for (let i = 0; i < n; i++) {
    let max = 0
    for (let j = 0; j < n; j++) {
      row[j] = Math.max(0, f(i, j))
      if (row[j] > max) max = row[j]
    }
    if (max > 0) for (let j = 0; j < n; j++) out[i * n + j] = row[j] / max
  }
  return out
}

/** Dims rows away from the query row: out = base * (floor + (1 - floor) * near). */
export function sweepWeights(
  base: Float32Array,
  n: number,
  queryRow: number,
  out: Float32Array,
): Float32Array {
  for (let i = 0; i < n; i++) {
    const near = Math.max(0, 1 - Math.abs(i + 0.5 - queryRow) / SWEEP_SPREAD)
    const k = SWEEP_FLOOR + (1 - SWEEP_FLOOR) * near
    for (let j = 0; j < n; j++) out[i * n + j] = base[i * n + j] * k
  }
  return out
}

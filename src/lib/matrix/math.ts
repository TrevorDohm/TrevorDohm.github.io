export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** Deterministic noise in [0, 1) from integer mixing, identical in every JS engine. */
export function hash2(i: number, j: number): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

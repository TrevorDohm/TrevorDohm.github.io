/**
 * Splits items into `rows` rows with categories interleaved, so no two
 * neighbours share a category (including across the loop seam when counts allow).
 * Dealing alternately would leave only two categories per row, so instead:
 * build one round-robin sequence across `order`, then cut it into contiguous
 * chunks whose lengths differ by at most 1 (earlier rows take the extra item).
 */
export function itemsByRow<T extends { category: string }>(
  items: readonly T[],
  rows: number,
  order: readonly string[],
): T[][] {
  const groups = order.map((c) => items.filter((x) => x.category === c))
  const sequence: T[] = []
  for (let i = 0; sequence.length < groups.reduce((n, g) => n + g.length, 0); i++)
    for (const g of groups) if (i < g.length) sequence.push(g[i])

  const base = Math.floor(sequence.length / rows)
  const extra = sequence.length % rows
  const out: T[][] = []
  let start = 0
  for (let r = 0; r < rows; r++) {
    const len = base + (r < extra ? 1 : 0)
    out.push(sequence.slice(start, start + len))
    start += len
  }
  return out
}

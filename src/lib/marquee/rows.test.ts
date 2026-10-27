import { describe, expect, it } from 'vitest'
import { itemsByRow } from './rows'

const ORDER = ['ml', 'bake', 'mba', 'hike']

// Local fixture, not src/data/ (only pages and layouts import data). It must
// track the real ribbon category counts: ml 6, bake 6, mba 4, hike 4.
const COUNTS: Record<string, number> = { ml: 6, bake: 6, mba: 4, hike: 4 }
const ITEMS = Object.entries(COUNTS).flatMap(([category, n]) =>
  Array.from({ length: n }, (_, i) => ({ category, label: `${category}${i + 1}` })),
)

describe('itemsByRow', () => {
  it('places every item exactly once', () => {
    const rows = itemsByRow(ITEMS, 2, ORDER)
    const labels = rows.flat().map((x) => x.label).sort()
    expect(labels).toEqual(ITEMS.map((x) => x.label).sort())
  })

  it('keeps row lengths within 1 of each other', () => {
    for (const n of [20, 3]) {
      const rows = itemsByRow(ITEMS.slice(0, n), 2, ORDER)
      expect(Math.abs(rows[0].length - rows[1].length)).toBeLessThanOrEqual(1)
      expect(rows.flat()).toHaveLength(n)
    }
  })

  it('never puts the same category side by side for the 6/6/4/4 fixture', () => {
    for (const row of itemsByRow(ITEMS, 2, ORDER)) {
      for (let i = 0; i < row.length; i++) {
        const next = row[(i + 1) % row.length] // wraps to 0 at the loop seam
        expect(row[i].category).not.toBe(next.category)
      }
    }
  })

  it('produces the documented rows for the fixture', () => {
    const [a, b] = itemsByRow(ITEMS, 2, ORDER).map((r) => r.map((x) => x.category).join(' '))
    expect(a).toBe('ml bake mba hike ml bake mba hike ml bake')
    expect(b).toBe('mba hike ml bake mba hike ml bake ml bake')
  })

  it('returns empty rows for empty input', () => expect(itemsByRow([], 2, ORDER)).toEqual([[], []]))
})

import { describe, expect, it } from 'vitest'
import { gridNudge } from './align'
import { CELL_FILL, layoutGrid } from './geometry'

// A row's drawn cell starts half a gap below its row line.
const firstCellBelow = (navBottom: number, nameTop: number, pitch: number) => {
  const grid = layoutGrid(1462, 737, pitch, 240, nameTop)
  const gap = pitch * (1 - CELL_FILL)
  for (let r = 0; r < grid.rows; r++) {
    const top = grid.originY + r * pitch + gap / 2
    if (top >= navBottom - 1e-6) return { top, gap }
  }
  throw new Error('no row below the nav')
}

describe('gridNudge', () => {
  it('moves the name so the first row below the nav starts one cell gap under it', () => {
    for (const [nav, top, pitch] of [[65, 247, 30], [65, 250, 30], [135, 284, 14], [73, 301, 17.3], [65, 200, 52]]) {
      const d = gridNudge(top, nav, pitch)
      const { top: first, gap } = firstCellBelow(nav, top + d, pitch)
      expect(first - nav).toBeCloseTo(gap, 6)
    }
  })

  it('takes the nearer way, never more than half a row', () => {
    for (let top = 200; top < 260; top += 0.7) {
      const d = gridNudge(top, 65, 30)
      expect(Math.abs(d)).toBeLessThanOrEqual(15.5 + 1e-9)
    }
  })

  it('settles a near-halfway case the same way either side of a rounding error', () => {
    const pitch = 30
    const line = 65 + (pitch * (1 - CELL_FILL)) / 2
    const halfway = line - pitch / 2 // a name top exactly half a row off
    expect(gridNudge(halfway - 0.001, 65, pitch)).toBeCloseTo(gridNudge(halfway + 0.001, 65, pitch), 1)
  })

  it('leaves an already aligned name where it is', () => {
    const pitch = 30
    const gap = pitch * (1 - CELL_FILL)
    expect(gridNudge(65 + gap / 2 + 6 * pitch, 65, pitch)).toBeCloseTo(0, 9)
  })
})

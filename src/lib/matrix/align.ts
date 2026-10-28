import { CELL_FILL } from './geometry'

/**
 * How far to move the name block (px, either way, at most half a row) so the
 * grid, which is laid out from the name's top edge (`nameTop`, on a row
 * line), puts a row line half a cell gap below the nav's bottom edge
 * (`navBottom`). The first cell below the nav then starts one cell gap under
 * it: the same space as between any two rows. Halfway, it moves down, with a
 * little slack so sub-pixel rounding can't flip it a whole row. Pure.
 */
export function gridNudge(nameTop: number, navBottom: number, pitch: number): number {
  const line = navBottom + (pitch * (1 - CELL_FILL)) / 2
  const d = (((line - nameTop) % pitch) + pitch) % pitch
  return d > pitch / 2 + 0.5 ? d - pitch : d
}

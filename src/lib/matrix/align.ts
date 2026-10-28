import { CELL_FILL } from './geometry'

/**
 * How far to move the name block (px, either way, at most half a row) so the
 * grid, which is laid out from the name's top edge (`nameTop`, on a row
 * line), puts a row line half a cell gap below the nav's bottom edge
 * (`navBottom`). The first cell below the nav then starts one cell gap under
 * it: the same space as between any two rows. Pure.
 */
export function gridNudge(nameTop: number, navBottom: number, pitch: number): number {
  const line = navBottom + (pitch * (1 - CELL_FILL)) / 2
  const d = (((line - nameTop) % pitch) + pitch) % pitch
  return d > pitch / 2 ? d - pitch : d
}

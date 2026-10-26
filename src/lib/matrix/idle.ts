import { idlePoint } from './effects'
import { DISSOLVE_BAND } from './name'

/**
 * The query's idle path, `t` seconds after the break, on a canvas of
 * width x height: a loop over the area above the bottom dissolve band, so the
 * glow never drifts into the rows that are fading out.
 */
export function idleQuery(t: number, width: number, height: number): [number, number] {
  return idlePoint(t, 0, 0, width, height * (1 - DISSOLVE_BAND))
}

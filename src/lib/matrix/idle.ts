/**
 * The query's idle path, `t` seconds after the break, on a canvas of
 * width x height: the mockup's drift. x spans 0.16 to 0.84 of the width and y
 * 0.15 to 0.75 of the height, so the glow stays above the bottom dissolve band
 * (the lowest 22% of rows).
 */
export function idleQuery(t: number, width: number, height: number): [number, number] {
  return [
    width * (0.5 + 0.34 * Math.sin(t * 0.31) * Math.cos(t * 0.13)),
    height * (0.45 + 0.3 * Math.sin(t * 0.23 + 1)),
  ]
}

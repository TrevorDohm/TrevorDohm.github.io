/**
 * The query's idle path, `t` seconds after the break, on a canvas of
 * width x height: the mockup's drift with its y range scaled to fit above the
 * bottom dissolve band (the lowest 45% of rows). x spans 0.16 to 0.84 of the
 * width and y 0.14 to 0.48 of the height (the mockup's 0.15 to 0.75).
 */
export function idleQuery(t: number, width: number, height: number): [number, number] {
  return [
    width * (0.5 + 0.34 * Math.sin(t * 0.31) * Math.cos(t * 0.13)),
    height * (0.31 + 0.17 * Math.sin(t * 0.23 + 1)),
  ]
}

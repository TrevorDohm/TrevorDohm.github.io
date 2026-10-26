/**
 * The query's idle path, `t` seconds after the break, on a canvas of
 * width x height: the mockup's drift with its y range scaled to stay above the
 * bottom fade. x spans 0.16 to 0.84 of the width and y 0.14 to 0.48 of the
 * height (the mockup's 0.15 to 0.75), or 0.14 of the height to `floor` (px)
 * when the fade starts higher than that, keeping the same shape.
 */
export function idleQuery(t: number, width: number, height: number, floor = Infinity): [number, number] {
  const top = 0.14 * height
  const bottom = Math.max(top, Math.min(0.48 * height, floor))
  return [
    width * (0.5 + 0.34 * Math.sin(t * 0.31) * Math.cos(t * 0.13)),
    top + (bottom - top) * (0.5 + 0.5 * Math.sin(t * 0.23 + 1)),
  ]
}

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

/**
 * An upper bound on the idle path's speed (px/s) on this canvas. d/dt of
 * sin(0.31t)cos(0.13t) is 0.31 cos cos - 0.13 sin sin, at most
 * sqrt(0.31^2 + 0.13^2) (Cauchy-Schwarz), and of sin(0.23t + 1) at most 0.23;
 * the path's actual top speed is within about 10% of this.
 */
export function idleSpeed(width: number, height: number, floor = Infinity): number {
  const top = 0.14 * height
  const bottom = Math.max(top, Math.min(0.48 * height, floor))
  return Math.hypot(0.34 * width * Math.hypot(0.31, 0.13), 0.5 * (bottom - top) * 0.23)
}

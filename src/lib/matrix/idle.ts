/**
 * The query's idle path, `t` seconds after the break, on a canvas of
 * width x height: the mockup's drift with its y range scaled to stay above the
 * bottom fade. x spans 0.16 to 0.84 of the width and y 0.14 to 0.48 of the
 * height (the mockup's 0.15 to 0.75), or 0.14 of the height to `floor` (px)
 * when the fade starts higher than that, keeping the same shape. Its top is
 * `ceiling` (px) instead when the top fade reaches lower than 0.14.
 */
export function idleQuery(t: number, width: number, height: number, floor = Infinity, ceiling = -Infinity): [number, number] {
  const top = Math.max(0.14 * height, ceiling)
  const bottom = Math.max(top, Math.min(0.48 * height, floor))
  return [
    width * (0.5 + 0.34 * Math.sin(t * 0.31) * Math.cos(t * 0.13)),
    top + (bottom - top) * (0.5 + 0.5 * Math.sin(t * 0.23 + 1)),
  ]
}

/**
 * The idle path's actual top speed (px/s) on this canvas, from its derivative
 * sampled every 0.05 s over 20 minutes. Its three frequencies never line up
 * into one short cycle, so a long window stands in for one; the peak it finds
 * is within 1% of the true one. About 24,000 samples: compute it once per
 * layout, not per frame.
 */
export function idlePeakSpeed(width: number, height: number, floor = Infinity, ceiling = -Infinity): number {
  const top = Math.max(0.14 * height, ceiling)
  const span = Math.max(top, Math.min(0.48 * height, floor)) - top
  let peak = 0
  for (let t = 0; t < 1200; t += 0.05) {
    const a = 0.31 * t
    const b = 0.13 * t
    const vx = 0.34 * width * (0.31 * Math.cos(a) * Math.cos(b) - 0.13 * Math.sin(a) * Math.sin(b))
    const vy = 0.5 * span * 0.23 * Math.cos(0.23 * t + 1)
    peak = Math.max(peak, Math.hypot(vx, vy))
  }
  return peak
}

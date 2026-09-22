/**
 * Attention weights for the matrix. Pure.
 *
 * A softmax over negative distance to the query, divided by its largest value:
 * exp(-(d_i - d_min) / temperature). Ratios match the softmax, the nearest cell
 * is exactly 1, and nothing overflows. Distances are in cells, not pixels.
 */
export function attentionWeights(
  centers: Float32Array,
  pitch: number,
  qx: number,
  qy: number,
  temperature: number,
  out: Float32Array,
): Float32Array {
  const count = centers.length / 2
  let nearest = Infinity
  for (let i = 0; i < count; i++) {
    const d = Math.hypot(centers[i * 2] - qx, centers[i * 2 + 1] - qy) / pitch
    out[i] = d
    if (d < nearest) nearest = d
  }
  for (let i = 0; i < count; i++) {
    out[i] = Math.exp(-(out[i] - nearest) / temperature)
  }
  return out
}

/**
 * Moves each value toward its target by 1 - exp(-rate * dt), so the motion
 * looks the same at any frame rate. `rate` is per second.
 */
export function easeToward(
  current: Float32Array,
  target: Float32Array,
  rate: number,
  dtSeconds: number,
): void {
  const k = 1 - Math.exp(-rate * dtSeconds)
  for (let i = 0; i < current.length; i++) {
    current[i] += (target[i] - current[i]) * k
  }
}

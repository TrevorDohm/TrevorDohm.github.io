/**
 * Attention weights for the matrix. Pure.
 *
 * exp(-d_i / temperature), with d_i the distance in cells from the query to
 * cell i: the softmax numerator over negative distance, unnormalised as in the
 * mockup, so a cell right under the query is 1 and the peak dims a little when
 * the query sits between cells. Nothing overflows since d_i >= 0.
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
  for (let i = 0; i < count; i++) {
    const d = Math.hypot(centers[i * 2] - qx, centers[i * 2 + 1] - qy) / pitch
    out[i] = Math.exp(-d / temperature)
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

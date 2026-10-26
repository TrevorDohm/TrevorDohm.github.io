import { CELL_RADIUS, type Grid } from './geometry'
import { mix, rampTable, type Rgb } from './color'
import { maskedWeight } from './mask'

export interface Palette {
  line: Rgb
  accent: Rgb
  accent2: Rgb
}

export interface Frame {
  /** Eased attention, 0 to 1. */
  weights: Float32Array
  /** Extra brightness from click drops, added on top. */
  boost: Float32Array
  /** Per-cell visibility, 0 to 1 (the bottom dissolve). Scales weight and opacity. */
  fade: Float32Array
  /** From copyMask: MASKED and EDGE cells are dimmed by maskedWeight and get no glow. */
  copy: Uint8Array
}

export interface Renderer {
  resize(grid: Grid, width: number, height: number, pixelRatio: number): void
  draw(frame: Frame): void
}

/** Cells below this brightness get no glow sprite. */
const GLOW_THRESHOLD = 0.2
/** Glow sprite size relative to a cell. */
const GLOW_SCALE = 2.6
/** Resting opacity of a cell at weight 0; rises to 1 at weight 1. */
const BASE_ALPHA = 0.55
/** Steps in the precomputed colour ramp. */
const RAMP_STEPS = 101

function makeGlowSprite(color: Rgb): HTMLCanvasElement {
  const size = 64
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = size
  const ctx = sprite.getContext('2d')
  if (!ctx) return sprite
  const [r, g, b] = color
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, `rgba(${r},${g},${b},1)`)
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return sprite
}

export function createRenderer(canvas: HTMLCanvasElement, palette: Palette): Renderer {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas is unavailable')
  const ctx = context
  // The glow sits between the two accents, like the top of the ramp.
  const sprite = makeGlowSprite(mix(palette.accent, palette.accent2, 0.5))
  const ramp = rampTable(RAMP_STEPS, palette.line, palette.accent, palette.accent2)
  let grid: Grid | null = null
  let cssWidth = 0
  let cssHeight = 0

  function resize(next: Grid, width: number, height: number, pixelRatio: number): void {
    grid = next
    cssWidth = width
    cssHeight = height
    const dpr = Math.min(pixelRatio, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function draw({ weights, boost, fade, copy }: Frame): void {
    if (!grid) return
    const { cols, rows, cell, centers } = grid
    const half = cell / 2
    const radius = cell * CELL_RADIUS
    const glowSize = cell * GLOW_SCALE
    ctx.clearRect(0, 0, cssWidth, cssHeight)

    for (let i = 0; i < cols * rows; i++) {
      const appear = fade[i]
      if (appear <= 0) continue
      const w = maskedWeight(Math.min(1, weights[i] + boost[i]), copy[i]) * appear
      ctx.globalAlpha = appear * (BASE_ALPHA + (1 - BASE_ALPHA) * w)
      ctx.fillStyle = ramp[Math.round(w * (RAMP_STEPS - 1))]
      ctx.beginPath()
      ctx.roundRect(centers[i * 2] - half, centers[i * 2 + 1] - half, cell, cell, radius)
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < cols * rows; i++) {
      const appear = fade[i]
      if (copy[i]) continue
      const w = Math.min(1, weights[i] + boost[i]) * appear
      if (w <= GLOW_THRESHOLD) continue
      ctx.globalAlpha = appear * ((w - GLOW_THRESHOLD) / (1 - GLOW_THRESHOLD)) * 0.55
      ctx.drawImage(sprite, centers[i * 2] - glowSize / 2, centers[i * 2 + 1] - glowSize / 2, glowSize, glowSize)
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  return { resize, draw }
}

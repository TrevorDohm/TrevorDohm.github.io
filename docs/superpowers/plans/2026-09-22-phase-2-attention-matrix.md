# Phase 2: Attention Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the interactive canvas attention matrix behind the home hero, and fix the hero's mobile LCP problem (bead `web-k8c`), leaving the site shippable.

**Architecture:** Pure modules in `src/lib/matrix/` do all math (grid layout, attention weights, easing, color ramp, ripples, idle path, intro wave, input state) and are unit tested. Three thin DOM modules draw frames (`renderer.ts`), run the frame loop (`loop.ts`), and translate pointer/focus events (`input.ts`). `index.ts` exports `init(root)` wiring them together. `AttentionMatrix.astro` renders the canvas and calls `init` on every `[data-matrix-root]`.

**Tech Stack:** Astro 7.3, Tailwind CSS 4.3, TypeScript, Vitest 5, Canvas 2D.

**Spec:** `PLAN.md`, section "Now: Design overhaul", subsection "The attention matrix (hero)". Also read "Code structure" and "Motion across the site" item 1.

## Global Constraints

- Canvas 2D in plain TypeScript. No WebGL, no libraries.
- Grid: 24×24 cells when the canvas is ≥ 768px wide, 14×14 below that.
- Cursor is the query. Cell weight is a softmax over negative distance to the query, rescaled so the nearest cell is 1.
- Glow: a pre-rendered radial-gradient sprite drawn with `globalCompositeOperation = 'lighter'`. Never `ctx.shadowBlur`.
- Weights ease toward their target each frame (trailing glow).
- Hovered cell's row and column light faintly.
- Click/tap sends a ripple outward. Hovering or focusing a hero button moves the query onto it.
- Idle drift after 2 seconds without input, at ~30fps.
- Touch: tap = ripple + move query; horizontal drag moves it; vertical drag scrolls the page (`touch-action: pan-y`).
- Pointer listeners on the hero `<section>`, not the canvas. Canvas is `pointer-events: none` and `aria-hidden`.
- Intro: cells fade in as a diagonal wave.
- `requestAnimationFrame`, started after the window `load` event. Pauses when the hero is offscreen or the tab is hidden. Device pixel ratio capped at 2. Cell positions computed once per resize, not per frame. Ignore height-only resizes smaller than 120px (mobile address bar).
- Target: 60fps on a 2020-era laptop; matrix JS under 8 KB gzipped; all site JS under 15 KB gzipped.
- `prefers-reduced-motion`: one static frame, no idle drift, no ripple, no input handling.
- Without JS, the existing CSS gradient backdrop shows; name and tagline render normally.
- Colors come from the CSS tokens (`--color-line`, `--color-accent`, `--color-accent-2`), read at runtime. No raw hex in components or `src/lib`.
- The hero `<h1>` never starts at `opacity: 0`, and (bead `web-k8c`) no hero text starts at `opacity: 0`.
- Code rules from CLAUDE.md: pure logic in `src/lib/` with a Vitest test beside it, written first; client behaviors export `init(root: HTMLElement): () => void`; only pages/layouts import `src/data/`; files under ~150 lines.
- Copy and commit messages follow no-ai-slop. Commits: sentence case, imperative, no `feat:` prefix, ending with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` exactly.

## Environment

Prefix Node commands with:

```bash
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH" && eval "$(fnm env --shell zsh)" && fnm use 22 >/dev/null
```

Branch `design-overhaul` in `/Users/tdohm/code/website`. Never push, merge, or switch branches. Don't touch `.beads/`, `.superpowers/` (except your report file), or `AGENTS.md`.

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/styles/tokens.css`, `src/styles/motion.css` | Modify | Replace fade keyframes with `rise` (no opacity) |
| `src/components/home/Hero.astro` | Modify (Tasks 1, 6) | Use `animate-rise`; host the matrix |
| `src/lib/matrix/geometry.ts` (+test) | Create | Grid size and cell centers from canvas size; cell under a point |
| `src/lib/matrix/attention.ts` (+test) | Create | Attention weights; frame-rate-independent easing |
| `src/lib/matrix/math.ts` (+test) | Create | `clamp01` |
| `src/lib/matrix/color.ts` (+test) | Create | Parse token hex; mix; weight → color ramp |
| `src/lib/matrix/state.ts` (+test) | Create | Input state: query, hover, ripples, idle detection |
| `src/lib/matrix/effects.ts` (+test) | Create | Ripple ring, idle path, intro wave, per-cell boost |
| `src/lib/matrix/renderer.ts` | Create | Draws one frame to the canvas |
| `src/lib/matrix/loop.ts` | Create | rAF loop with offscreen/hidden pause and idle throttle |
| `src/lib/matrix/input.ts` | Create | Pointer and focus events → state |
| `src/lib/matrix/index.ts` | Create | `init(root)`: wires everything; reduced-motion path |
| `src/components/matrix/AttentionMatrix.astro` | Create | The canvas element and its init script |

---

### Task 1: Hero text that never starts invisible (bead web-k8c)

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/motion.css`, `src/components/home/Hero.astro`

**Interfaces:**
- Produces: Tailwind utility `animate-rise`. Removes `animate-fade-in` and `animate-fade-in-up`, whose only users are in `Hero.astro`.

At 375px wide the tagline's text box is larger than the `<h1>`'s, so Chrome can pick the tagline as the LCP element. It starts at `opacity: 0`, which Chrome ignores for LCP until it fades in. The fix animates position and blur only, so every hero line is painted from the first frame.

No unit test: CSS only. Verification is the build plus greps.

- [ ] **Step 1: In `src/styles/tokens.css`, replace the two animation lines**

```css
  --animate-fade-in: fade-in 0.5s ease-out forwards;
  --animate-fade-in-up: fade-in-up 0.7s ease-out forwards;
```

with

```css
  /* Position and blur only, never opacity: hero text must count as painted
     from the first frame for LCP. */
  --animate-rise: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
```

- [ ] **Step 2: In `src/styles/motion.css`, replace both `@keyframes` blocks (`fade-in` and `fade-in-up`)** with

```css
@keyframes rise {
  from { transform: translateY(14px); filter: blur(8px); }
  to   { transform: none; filter: none; }
}
```

Leave the reduced-motion block below them unchanged.

- [ ] **Step 3: In `src/components/home/Hero.astro`, update the four animated elements.** Replace `opacity-0 animate-fade-in` and `opacity-0 animate-fade-in-up` with `animate-rise` and keep each existing `style="animation-delay: …"`. The result:

```astro
    <p class="eyebrow mb-6 animate-rise">{location}</p>
    <!-- The h1 is the LCP element, so it is visible from the first paint. -->
    <h1 class="heading-xl max-w-3xl">{name}</h1>
    <p class="body-lg mt-6 max-w-2xl animate-rise" style="animation-delay: 0.15s">
      {tagline}
    </p>
    <p class="mt-3 font-mono text-sm text-muted animate-rise" style="animation-delay: 0.25s">
      {role}
    </p>
    <div class="mt-10 flex flex-wrap gap-4 animate-rise" style="animation-delay: 0.35s">
```

- [ ] **Step 4: Verify**

```bash
npm test && npm run build
grep -rn "opacity-0\|fade-in" src/ || echo "no opacity-0 or fade-in left"
grep -c "@keyframes rise" dist/_astro/*.css
```

Expected: tests pass, build `0 errors`, `no opacity-0 or fade-in left`, and at least one file counts `1` for the keyframe.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/motion.css src/components/home/Hero.astro
git commit -m "Animate hero text with position and blur instead of opacity

On phones the tagline can be the LCP element, and Chrome ignores text
at opacity 0 until it fades in. The new rise animation keeps every
hero line painted from the first frame.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Grid geometry

**Files:**
- Create: `src/lib/matrix/geometry.ts`
- Test: `src/lib/matrix/geometry.test.ts`

**Interfaces:**
- Produces:
  - `interface Grid { n: number; pitch: number; cell: number; originX: number; originY: number; centers: Float32Array }`. `centers` holds `[x0, y0, x1, y1, …]` in row-major order, in CSS pixels. `pitch` is the distance between neighboring cell centers; `cell` is the drawn cell size.
  - `const MOBILE_BREAKPOINT = 768`, `const CELL_FILL = 0.78`
  - `cellsPerSide(width: number): number`
  - `layoutGrid(width: number, height: number): Grid`
  - `cellAt(grid: Grid, x: number, y: number): number` (cell index, or -1 outside the grid)

Layout rules: on desktop (width ≥ 768) the square grid has side `min(height × 0.85, width × 0.55)`, sits `width × 0.04` from the right edge, and is centered vertically, leaving the left side for the hero text. On phones the side is `width × 0.92`, centered both ways.

- [ ] **Step 1: Write the failing test** at `src/lib/matrix/geometry.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { CELL_FILL, cellAt, cellsPerSide, layoutGrid } from './geometry'

describe('cellsPerSide', () => {
  it('uses 14 cells below the mobile breakpoint and 24 at or above it', () => {
    expect(cellsPerSide(375)).toBe(14)
    expect(cellsPerSide(767)).toBe(14)
    expect(cellsPerSide(768)).toBe(24)
    expect(cellsPerSide(1280)).toBe(24)
  })
})

describe('layoutGrid on desktop', () => {
  const grid = layoutGrid(1280, 800)

  it('sizes the square grid from the smaller of the height and width limits', () => {
    // side = min(800 * 0.85, 1280 * 0.55) = min(680, 704) = 680
    expect(grid.n).toBe(24)
    expect(grid.pitch).toBeCloseTo(680 / 24)
    expect(grid.cell).toBeCloseTo((680 / 24) * CELL_FILL)
  })

  it('places the grid near the right edge and centers it vertically', () => {
    expect(grid.originX).toBeCloseTo(1280 - 680 - 1280 * 0.04)
    expect(grid.originY).toBeCloseTo((800 - 680) / 2)
    expect(grid.originX + grid.n * grid.pitch).toBeLessThanOrEqual(1280)
  })

  it('stores one center per cell, row-major', () => {
    expect(grid.centers.length).toBe(24 * 24 * 2)
    expect(grid.centers[0]).toBeCloseTo(grid.originX + grid.pitch / 2)
    expect(grid.centers[1]).toBeCloseTo(grid.originY + grid.pitch / 2)
    // cell 1 is one pitch to the right of cell 0, same row
    expect(grid.centers[2] - grid.centers[0]).toBeCloseTo(grid.pitch)
    expect(grid.centers[3]).toBeCloseTo(grid.centers[1])
    // cell n is one pitch below cell 0
    expect(grid.centers[24 * 2 + 1] - grid.centers[1]).toBeCloseTo(grid.pitch)
  })
})

describe('layoutGrid on a phone', () => {
  it('fills most of the width and centers the grid', () => {
    const grid = layoutGrid(375, 812)
    const side = 375 * 0.92
    expect(grid.n).toBe(14)
    expect(grid.pitch).toBeCloseTo(side / 14)
    expect(grid.originX).toBeCloseTo((375 - side) / 2)
    expect(grid.originY).toBeCloseTo((812 - side) / 2)
  })
})

describe('cellAt', () => {
  const grid = layoutGrid(1280, 800)
  const at = (col: number, row: number) =>
    [grid.originX + (col + 0.5) * grid.pitch, grid.originY + (row + 0.5) * grid.pitch] as const

  it('returns the row-major index of the cell under a point', () => {
    expect(cellAt(grid, ...at(0, 0))).toBe(0)
    expect(cellAt(grid, ...at(2, 1))).toBe(1 * 24 + 2)
    expect(cellAt(grid, ...at(23, 23))).toBe(24 * 24 - 1)
  })

  it('returns -1 outside the grid', () => {
    expect(cellAt(grid, grid.originX - 1, grid.originY + 10)).toBe(-1)
    expect(cellAt(grid, grid.originX + 10, grid.originY - 1)).toBe(-1)
    expect(cellAt(grid, grid.originX + grid.n * grid.pitch + 1, grid.originY + 10)).toBe(-1)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/matrix/geometry.test.ts`
Expected: FAIL, `Failed to resolve import "./geometry"`.

- [ ] **Step 3: Implement `src/lib/matrix/geometry.ts`**

```ts
/**
 * Grid layout for the attention matrix. Pure: every value is in CSS pixels.
 */
export interface Grid {
  /** Cells per side. */
  n: number
  /** Distance between neighboring cell centers. */
  pitch: number
  /** Drawn size of one cell. */
  cell: number
  originX: number
  originY: number
  /** Cell centers as [x0, y0, x1, y1, ...], row-major. */
  centers: Float32Array
}

export const MOBILE_BREAKPOINT = 768
/** Share of the pitch a cell covers; the rest is the gap between cells. */
export const CELL_FILL = 0.78

export function cellsPerSide(width: number): number {
  return width < MOBILE_BREAKPOINT ? 14 : 24
}

export function layoutGrid(width: number, height: number): Grid {
  const n = cellsPerSide(width)
  const mobile = width < MOBILE_BREAKPOINT
  // Desktop keeps the left side clear for the hero text.
  const side = mobile ? width * 0.92 : Math.min(height * 0.85, width * 0.55)
  const pitch = side / n
  const originX = mobile ? (width - side) / 2 : width - side - width * 0.04
  const originY = (height - side) / 2

  const centers = new Float32Array(n * n * 2)
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = (row * n + col) * 2
      centers[i] = originX + (col + 0.5) * pitch
      centers[i + 1] = originY + (row + 0.5) * pitch
    }
  }

  return { n, pitch, cell: pitch * CELL_FILL, originX, originY, centers }
}

/** Index of the cell under (x, y), or -1 when the point is outside the grid. */
export function cellAt(grid: Grid, x: number, y: number): number {
  const col = Math.floor((x - grid.originX) / grid.pitch)
  const row = Math.floor((y - grid.originY) / grid.pitch)
  if (col < 0 || row < 0 || col >= grid.n || row >= grid.n) return -1
  return row * grid.n + col
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/lib/matrix/geometry.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Full suite, build, commit**

```bash
npm test && npm run build
git add src/lib/matrix/geometry.ts src/lib/matrix/geometry.test.ts
git commit -m "Add grid layout for the attention matrix

Pure functions for the grid's size, position, and cell centers from the
canvas size, plus a lookup for the cell under a point.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Attention weights and easing

**Files:**
- Create: `src/lib/matrix/attention.ts`
- Test: `src/lib/matrix/attention.test.ts`

**Interfaces:**
- Produces:
  - `attentionWeights(centers: Float32Array, pitch: number, qx: number, qy: number, temperature: number, out: Float32Array): Float32Array`. Writes one weight per cell into `out` and returns `out`. Distances are measured in cells (divided by `pitch`), so `temperature` is in cells.
  - `easeToward(current: Float32Array, target: Float32Array, rate: number, dtSeconds: number): void`. Moves `current` toward `target` in place by the fraction `1 - exp(-rate × dt)`.

Why the rescaling: a softmax over 576 cells gives tiny values that sum to 1. Dividing every softmax value by the largest one gives `exp(-(dᵢ - d_min) / temperature)`, which keeps the softmax's ratios, peaks at exactly 1, and avoids overflow.

- [ ] **Step 1: Write the failing test** at `src/lib/matrix/attention.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { attentionWeights, easeToward } from './attention'

// Three cells on one row, 10px apart (pitch 10), so distances in cells are 0, 1, 2.
const centers = new Float32Array([0, 0, 10, 0, 20, 0])

describe('attentionWeights', () => {
  it('gives the nearest cell a weight of exactly 1', () => {
    const w = attentionWeights(centers, 10, 0, 0, 1, new Float32Array(3))
    expect(w[0]).toBe(1)
  })

  it('keeps every weight in (0, 1] and decreasing with distance', () => {
    const w = attentionWeights(centers, 10, 0, 0, 1, new Float32Array(3))
    for (const v of w) {
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    expect(w[1]).toBeLessThan(w[0])
    expect(w[2]).toBeLessThan(w[1])
  })

  it('preserves the ratios of a plain softmax over negative distance', () => {
    const temperature = 1.5
    const w = attentionWeights(centers, 10, 3, 4, temperature, new Float32Array(3))
    const d = [0, 1, 2].map((i) => Math.hypot(centers[i * 2] - 3, centers[i * 2 + 1] - 4) / 10)
    const exps = d.map((x) => Math.exp(-x / temperature))
    const sum = exps.reduce((a, b) => a + b, 0)
    const softmax = exps.map((e) => e / sum)
    expect(w[1] / w[0]).toBeCloseTo(softmax[1] / softmax[0])
    expect(w[2] / w[0]).toBeCloseTo(softmax[2] / softmax[0])
  })

  it('spreads attention wider at a higher temperature', () => {
    const cold = attentionWeights(centers, 10, 0, 0, 0.5, new Float32Array(3))
    const warm = attentionWeights(centers, 10, 0, 0, 3, new Float32Array(3))
    expect(warm[2]).toBeGreaterThan(cold[2])
  })

  it('measures distance in cells, so scaling the grid does not change weights', () => {
    const scaled = new Float32Array([0, 0, 20, 0, 40, 0])
    const a = attentionWeights(centers, 10, 0, 0, 1, new Float32Array(3))
    const b = attentionWeights(scaled, 20, 0, 0, 1, new Float32Array(3))
    expect(Array.from(b)).toEqual(Array.from(a))
  })

  it('writes into and returns the output array', () => {
    const out = new Float32Array(3)
    expect(attentionWeights(centers, 10, 0, 0, 1, out)).toBe(out)
  })
})

describe('easeToward', () => {
  it('does not move when no time has passed', () => {
    const current = new Float32Array([0, 1])
    easeToward(current, new Float32Array([1, 0]), 5, 0)
    expect(Array.from(current)).toEqual([0, 1])
  })

  it('covers half the distance after one half-life', () => {
    const current = new Float32Array([0])
    easeToward(current, new Float32Array([1]), Math.LN2, 1)
    expect(current[0]).toBeCloseTo(0.5)
  })

  it('arrives at the target after a long step', () => {
    const current = new Float32Array([0, 10])
    easeToward(current, new Float32Array([1, 2]), 5, 100)
    expect(current[0]).toBeCloseTo(1)
    expect(current[1]).toBeCloseTo(2)
  })

  it('gives the same result for one step or two half steps', () => {
    const once = new Float32Array([0])
    const twice = new Float32Array([0])
    const target = new Float32Array([1])
    easeToward(once, target, 4, 0.2)
    easeToward(twice, target, 4, 0.1)
    easeToward(twice, target, 4, 0.1)
    expect(twice[0]).toBeCloseTo(once[0])
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/matrix/attention.test.ts`
Expected: FAIL, `Failed to resolve import "./attention"`.

- [ ] **Step 3: Implement `src/lib/matrix/attention.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/lib/matrix/attention.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Full suite, build, commit**

```bash
npm test && npm run build
git add src/lib/matrix/attention.ts src/lib/matrix/attention.test.ts
git commit -m "Add attention weights and easing for the matrix

Weights are a softmax over distance to the query, rescaled so the
nearest cell is 1. Easing is frame-rate independent.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Color, state, and effects modules

**Files:**
- Create: `src/lib/matrix/math.ts`, `src/lib/matrix/color.ts`, `src/lib/matrix/state.ts`, `src/lib/matrix/effects.ts`
- Test: `src/lib/matrix/math.test.ts`, `src/lib/matrix/color.test.ts`, `src/lib/matrix/state.test.ts`, `src/lib/matrix/effects.test.ts`

**Interfaces:**
- Consumes: `Grid` from `geometry.ts` (Task 2).
- Produces:
  - `math.ts`: `clamp01(x: number): number`
  - `color.ts`: `type Rgb = readonly [number, number, number]`; `parseHex(value: string): Rgb` (accepts `#rgb` / `#rrggbb` with surrounding whitespace, throws otherwise); `mix(a: Rgb, b: Rgb, t: number): Rgb` (clamps `t`, rounds channels); `const RAMP_SPLIT = 0.6`; `rampColor(w: number, line: Rgb, accent: Rgb, accent2: Rgb): Rgb`
  - `state.ts`: `interface Ripple { x: number; y: number; start: number }` (start in ms); `interface MatrixState { query: { x: number; y: number }; hasQuery: boolean; lastInput: number; hover: number; ripples: Ripple[] }`; `const IDLE_AFTER_MS = 2000`; `const MAX_RIPPLES = 6`; `createState(): MatrixState`; `isIdle(state: MatrixState, now: number): boolean`; `setQuery(state: MatrixState, x: number, y: number, now: number): void`; `addRipple(state: MatrixState, x: number, y: number, now: number): void`; `pruneRipples(state: MatrixState, now: number, lifetimeMs: number): void`
  - `effects.ts`: `const RIPPLE = { speed: 14, width: 0.9, lifetime: 1.4 }` (cells/s, cells, s); `rippleAt(distance: number, age: number, speed: number, width: number, lifetime: number): number`; `idlePoint(t: number, x: number, y: number, size: number): [number, number]`; `introAlpha(progress: number, row: number, col: number, n: number): number`; `applyBoost(boost: Float32Array, grid: Grid, hover: number, ripples: readonly Ripple[], now: number, axisBoost: number): Float32Array`

- [ ] **Step 1: Write the four failing test files.**

`src/lib/matrix/math.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { clamp01 } from './math'

describe('clamp01', () => {
  it('passes values in [0, 1] through and clamps the rest', () => {
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(-2)).toBe(0)
    expect(clamp01(3)).toBe(1)
  })
})
```

`src/lib/matrix/color.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { RAMP_SPLIT, mix, parseHex, rampColor, type Rgb } from './color'

describe('parseHex', () => {
  it('parses six-digit hex with surrounding whitespace, as CSS variables return it', () => {
    expect(parseHex(' #7c9cff ')).toEqual([124, 156, 255])
  })

  it('parses three-digit hex', () => {
    expect(parseHex('#fa0')).toEqual([255, 170, 0])
  })

  it('throws on values that are not hex colors', () => {
    expect(() => parseHex('')).toThrow()
    expect(() => parseHex('rgb(1, 2, 3)')).toThrow()
    expect(() => parseHex('#12345')).toThrow()
  })
})

describe('mix', () => {
  const black: Rgb = [0, 0, 0]
  const white: Rgb = [255, 255, 255]

  it('returns the endpoints at 0 and 1 and rounds in between', () => {
    expect(mix(black, white, 0)).toEqual([0, 0, 0])
    expect(mix(black, white, 1)).toEqual([255, 255, 255])
    expect(mix(black, white, 0.5)).toEqual([128, 128, 128])
  })

  it('clamps t outside [0, 1]', () => {
    expect(mix(black, white, -1)).toEqual([0, 0, 0])
    expect(mix(black, white, 2)).toEqual([255, 255, 255])
  })
})

describe('rampColor', () => {
  const line: Rgb = [30, 30, 42]
  const accent: Rgb = [124, 156, 255]
  const accent2: Rgb = [177, 140, 255]

  it('runs line → accent → accent-2 as the weight rises', () => {
    expect(rampColor(0, line, accent, accent2)).toEqual(line)
    expect(rampColor(RAMP_SPLIT, line, accent, accent2)).toEqual(accent)
    expect(rampColor(1, line, accent, accent2)).toEqual(accent2)
  })

  it('blends halfway between line and accent at half the split', () => {
    expect(rampColor(RAMP_SPLIT / 2, line, accent, accent2)).toEqual(mix(line, accent, 0.5))
  })

  it('clamps weights outside [0, 1]', () => {
    expect(rampColor(-1, line, accent, accent2)).toEqual(line)
    expect(rampColor(5, line, accent, accent2)).toEqual(accent2)
  })
})
```

`src/lib/matrix/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { IDLE_AFTER_MS, MAX_RIPPLES, addRipple, createState, isIdle, pruneRipples, setQuery } from './state'

describe('matrix state', () => {
  it('starts idle, with no query, hover, or ripples', () => {
    const s = createState()
    expect(s.hasQuery).toBe(false)
    expect(s.hover).toBe(-1)
    expect(s.ripples).toEqual([])
    expect(isIdle(s, 0)).toBe(true)
  })

  it('is active right after input and idle once IDLE_AFTER_MS has passed', () => {
    const s = createState()
    setQuery(s, 10, 20, 1000)
    expect(s.query).toEqual({ x: 10, y: 20 })
    expect(s.hasQuery).toBe(true)
    expect(isIdle(s, 1000 + IDLE_AFTER_MS)).toBe(false)
    expect(isIdle(s, 1000 + IDLE_AFTER_MS + 1)).toBe(true)
  })

  it('keeps at most MAX_RIPPLES, dropping the oldest', () => {
    const s = createState()
    for (let i = 0; i < MAX_RIPPLES + 2; i++) addRipple(s, i, 0, i)
    expect(s.ripples.length).toBe(MAX_RIPPLES)
    expect(s.ripples[0].start).toBe(2)
  })

  it('prunes ripples older than their lifetime', () => {
    const s = createState()
    addRipple(s, 0, 0, 0)
    addRipple(s, 0, 0, 500)
    pruneRipples(s, 1200, 1000)
    expect(s.ripples.map((r) => r.start)).toEqual([500])
  })
})
```

`src/lib/matrix/effects.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { applyBoost, idlePoint, introAlpha, rippleAt } from './effects'
import { layoutGrid } from './geometry'

describe('rippleAt', () => {
  const speed = 10
  const width = 1
  const lifetime = 2

  it('is zero before it starts and after its lifetime', () => {
    expect(rippleAt(0, -0.1, speed, width, lifetime)).toBe(0)
    expect(rippleAt(20, lifetime, speed, width, lifetime)).toBe(0)
  })

  it('peaks on the expanding ring', () => {
    const age = 0.5 // ring radius = 5
    const onRing = rippleAt(5, age, speed, width, lifetime)
    expect(onRing).toBeGreaterThan(rippleAt(3, age, speed, width, lifetime))
    expect(onRing).toBeGreaterThan(rippleAt(7, age, speed, width, lifetime))
  })

  it('fades as it ages', () => {
    const early = rippleAt(2, 0.2, speed, width, lifetime)
    const late = rippleAt(15, 1.5, speed, width, lifetime)
    expect(late).toBeLessThan(early)
  })
})

describe('idlePoint', () => {
  it('stays inside the box and moves over time', () => {
    const points = Array.from({ length: 200 }, (_, i) => idlePoint(i * 0.5, 100, 50, 400))
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(100)
      expect(x).toBeLessThanOrEqual(500)
      expect(y).toBeGreaterThanOrEqual(50)
      expect(y).toBeLessThanOrEqual(450)
    }
    expect(points[0]).not.toEqual(points[10])
  })
})

describe('introAlpha', () => {
  it('hides every cell at the start and shows every cell at the end', () => {
    expect(introAlpha(0, 0, 0, 24)).toBe(0)
    expect(introAlpha(0, 23, 23, 24)).toBe(0)
    expect(introAlpha(1, 0, 0, 24)).toBe(1)
    expect(introAlpha(1, 23, 23, 24)).toBe(1)
  })

  it('reveals the top-left corner before the bottom-right', () => {
    expect(introAlpha(0.4, 0, 0, 24)).toBeGreaterThan(introAlpha(0.4, 23, 23, 24))
  })
})

describe('applyBoost', () => {
  const grid = layoutGrid(1280, 800)
  const n = grid.n

  it('adds the axis boost once to every cell in the hovered row and column', () => {
    const boost = new Float32Array(n * n)
    const hover = 3 * n + 5 // row 3, col 5
    applyBoost(boost, grid, hover, [], 0, 0.1)
    expect(boost[hover]).toBeCloseTo(0.1)
    expect(boost[3 * n + 0]).toBeCloseTo(0.1)
    expect(boost[0 * n + 5]).toBeCloseTo(0.1)
    expect(boost[0]).toBe(0)
  })

  it('resets the buffer each call', () => {
    const boost = new Float32Array(n * n).fill(9)
    applyBoost(boost, grid, -1, [], 0, 0.1)
    expect(Math.max(...boost)).toBe(0)
  })

  it('lights cells on the ring of an active ripple', () => {
    const boost = new Float32Array(n * n)
    const x = grid.centers[0]
    const y = grid.centers[1]
    // 0.5 s after a click at cell 0, the ring is 7 cells out (speed 14 cells/s).
    applyBoost(boost, grid, -1, [{ x, y, start: 0 }], 500, 0.1)
    expect(boost[7]).toBeGreaterThan(boost[2])
  })
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/lib/matrix`
Expected: the four new files FAIL with `Failed to resolve import`; geometry and attention tests still pass.

- [ ] **Step 3: Implement `src/lib/matrix/math.ts`**

```ts
export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}
```

- [ ] **Step 4: Implement `src/lib/matrix/color.ts`**

```ts
import { clamp01 } from './math'

export type Rgb = readonly [number, number, number]

/** Parses #rgb or #rrggbb, allowing the whitespace CSS custom properties keep. */
export function parseHex(value: string): Rgb {
  const hex = value.trim().replace(/^#/, '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Not a hex color: "${value}"`)
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = clamp01(t)
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ]
}

/** Weight at which a cell reaches the accent color. */
export const RAMP_SPLIT = 0.6

/** Cell color for a weight: line → accent up to RAMP_SPLIT, then accent → accent-2. */
export function rampColor(w: number, line: Rgb, accent: Rgb, accent2: Rgb): Rgb {
  const t = clamp01(w)
  return t < RAMP_SPLIT
    ? mix(line, accent, t / RAMP_SPLIT)
    : mix(accent, accent2, (t - RAMP_SPLIT) / (1 - RAMP_SPLIT))
}
```

- [ ] **Step 5: Implement `src/lib/matrix/state.ts`**

```ts
/** Input state the matrix reads each frame. Times are in milliseconds. */
export interface Ripple {
  x: number
  y: number
  start: number
}

export interface MatrixState {
  /** Where attention is centered, in canvas CSS pixels. */
  query: { x: number; y: number }
  /** True once the visitor has moved the query at least once. */
  hasQuery: boolean
  lastInput: number
  /** Cell under the cursor, or -1. */
  hover: number
  ripples: Ripple[]
}

export const IDLE_AFTER_MS = 2000
export const MAX_RIPPLES = 6

export function createState(): MatrixState {
  return { query: { x: 0, y: 0 }, hasQuery: false, lastInput: -Infinity, hover: -1, ripples: [] }
}

export function isIdle(state: MatrixState, now: number): boolean {
  return now - state.lastInput > IDLE_AFTER_MS
}

export function setQuery(state: MatrixState, x: number, y: number, now: number): void {
  state.query.x = x
  state.query.y = y
  state.hasQuery = true
  state.lastInput = now
}

export function addRipple(state: MatrixState, x: number, y: number, now: number): void {
  state.ripples.push({ x, y, start: now })
  if (state.ripples.length > MAX_RIPPLES) state.ripples.shift()
}

export function pruneRipples(state: MatrixState, now: number, lifetimeMs: number): void {
  state.ripples = state.ripples.filter((r) => now - r.start < lifetimeMs)
}
```

- [ ] **Step 6: Implement `src/lib/matrix/effects.ts`**

```ts
import type { Grid } from './geometry'
import { clamp01 } from './math'
import type { Ripple } from './state'

/** Ripple shape: speed in cells per second, ring width in cells, lifetime in seconds. */
export const RIPPLE = { speed: 14, width: 0.9, lifetime: 1.4 } as const

/**
 * Brightness a ripple adds at `distance` from its origin, `age` seconds after
 * it started: a Gaussian ring expanding at `speed` that fades out linearly.
 */
export function rippleAt(
  distance: number,
  age: number,
  speed: number,
  width: number,
  lifetime: number,
): number {
  if (age < 0 || age >= lifetime) return 0
  const offset = distance - age * speed
  return Math.exp(-(offset * offset) / (2 * width * width)) * (1 - age / lifetime)
}

/** A slow looping path inside the square at (x, y) with side `size`. `t` is in seconds. */
export function idlePoint(t: number, x: number, y: number, size: number): [number, number] {
  const r = size * 0.38
  return [
    x + size / 2 + r * Math.sin(t * 0.31),
    y + size / 2 + r * Math.sin(t * 0.23 + Math.PI / 2),
  ]
}

/** Visibility of a cell during the load-in wave, which sweeps from the top-left corner. */
export function introAlpha(progress: number, row: number, col: number, n: number): number {
  const start = n > 1 ? ((row + col) / (2 * (n - 1))) * 0.7 : 0
  return clamp01((progress - start) / 0.3)
}

/** Fills `boost` with extra brightness from the hovered row and column and active ripples. */
export function applyBoost(
  boost: Float32Array,
  grid: Grid,
  hover: number,
  ripples: readonly Ripple[],
  now: number,
  axisBoost: number,
): Float32Array {
  const { n, pitch, centers } = grid
  boost.fill(0)

  if (hover >= 0) {
    const row = Math.floor(hover / n)
    const col = hover % n
    for (let k = 0; k < n; k++) {
      boost[row * n + k] += axisBoost
      boost[k * n + col] += axisBoost
    }
    boost[hover] -= axisBoost // counted by both the row and the column
  }

  for (const ripple of ripples) {
    const age = (now - ripple.start) / 1000
    for (let i = 0; i < n * n; i++) {
      const d = Math.hypot(centers[i * 2] - ripple.x, centers[i * 2 + 1] - ripple.y) / pitch
      boost[i] += rippleAt(d, age, RIPPLE.speed, RIPPLE.width, RIPPLE.lifetime)
    }
  }
  return boost
}
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npx vitest run src/lib/matrix`
Expected: PASS. New counts: math 1, color 8, state 4, effects 9.

- [ ] **Step 8: Full suite, build, commit**

```bash
npm test && npm run build
git add src/lib/matrix/math.ts src/lib/matrix/math.test.ts src/lib/matrix/color.ts src/lib/matrix/color.test.ts src/lib/matrix/state.ts src/lib/matrix/state.test.ts src/lib/matrix/effects.ts src/lib/matrix/effects.test.ts
git commit -m "Add color, input state, and effect modules for the matrix

Color ramp from the design tokens, input state with idle detection,
and pure effects: ripples, idle drift path, intro wave, and the row,
column, and ripple boost.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Renderer and frame loop

**Files:**
- Create: `src/lib/matrix/renderer.ts`, `src/lib/matrix/loop.ts`

**Interfaces:**
- Consumes: `Grid` (Task 2); `rampColor`, `Rgb` (Task 4); `introAlpha` (Task 4).
- Produces:
  - `renderer.ts`: `interface Palette { line: Rgb; accent: Rgb; accent2: Rgb }`; `interface Frame { weights: Float32Array; boost: Float32Array; intro: number }`; `interface Renderer { resize(grid: Grid, width: number, height: number, pixelRatio: number): void; draw(frame: Frame): void }`; `createRenderer(canvas: HTMLCanvasElement, palette: Palette): Renderer` (throws if 2D context is unavailable)
  - `loop.ts`: `interface Loop { start(): void; stop(): void }`; `createLoop(root: Element, tick: (dtSeconds: number, now: number) => void, shouldThrottle: () => boolean): Loop`

Both modules touch the DOM, so they have no unit tests. They are verified through the running page in Tasks 6 and 7. Verification here is `npm test && npm run build` (which type-checks them).

- [ ] **Step 1: Create `src/lib/matrix/renderer.ts`**

```ts
import { introAlpha } from './effects'
import type { Grid } from './geometry'
import { rampColor, type Rgb } from './color'

export interface Palette {
  line: Rgb
  accent: Rgb
  accent2: Rgb
}

export interface Frame {
  /** Eased attention, 0 to 1. */
  weights: Float32Array
  /** Extra brightness from hover and ripples, added on top. */
  boost: Float32Array
  /** Load-in wave progress, 0 to 1. */
  intro: number
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
  const sprite = makeGlowSprite(palette.accent)
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

  function draw({ weights, boost, intro }: Frame): void {
    if (!grid) return
    const { n, cell, centers } = grid
    const half = cell / 2
    const glowSize = cell * GLOW_SCALE
    ctx.clearRect(0, 0, cssWidth, cssHeight)

    for (let i = 0; i < n * n; i++) {
      const appear = introAlpha(intro, Math.floor(i / n), i % n, n)
      if (appear <= 0) continue
      const w = Math.min(1, weights[i] + boost[i])
      const [r, g, b] = rampColor(w, palette.line, palette.accent, palette.accent2)
      ctx.globalAlpha = appear * (BASE_ALPHA + (1 - BASE_ALPHA) * w)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.beginPath()
      ctx.roundRect(centers[i * 2] - half, centers[i * 2 + 1] - half, cell, cell, cell * 0.22)
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < n * n; i++) {
      const w = Math.min(1, weights[i] + boost[i])
      if (w <= GLOW_THRESHOLD) continue
      const appear = introAlpha(intro, Math.floor(i / n), i % n, n)
      ctx.globalAlpha = appear * ((w - GLOW_THRESHOLD) / (1 - GLOW_THRESHOLD)) * 0.55
      ctx.drawImage(sprite, centers[i * 2] - glowSize / 2, centers[i * 2 + 1] - glowSize / 2, glowSize, glowSize)
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  return { resize, draw }
}
```

- [ ] **Step 2: Create `src/lib/matrix/loop.ts`**

```ts
/** Frame length while idle: about 30fps. */
const IDLE_FRAME_MS = 1000 / 30
/** Longest step passed to tick, so a resumed loop doesn't jump. */
const MAX_STEP_MS = 100

export interface Loop {
  start(): void
  stop(): void
}

/**
 * Calls `tick` on animation frames while the root is on screen and the tab is
 * visible. When `shouldThrottle()` is true, frames are capped at ~30fps.
 * `stop()` cancels the loop and removes its observers.
 */
export function createLoop(
  root: Element,
  tick: (dtSeconds: number, now: number) => void,
  shouldThrottle: () => boolean,
): Loop {
  let raf = 0
  let last = 0
  let wanted = false
  let onScreen = true

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const elapsed = now - last
    if (shouldThrottle() && elapsed < IDLE_FRAME_MS) return
    tick(Math.min(elapsed, MAX_STEP_MS) / 1000, now)
    last = now
  }

  const sync = () => {
    const run = wanted && onScreen && !document.hidden
    if (run && !raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    } else if (!run && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    sync()
  })
  observer.observe(root)
  document.addEventListener('visibilitychange', sync)

  return {
    start() {
      wanted = true
      sync()
    },
    stop() {
      wanted = false
      sync()
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    },
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm test && npm run build`
Expected: all tests pass; build `0 errors` (confirms both files type-check under the strict config).

- [ ] **Step 4: Commit**

```bash
git add src/lib/matrix/renderer.ts src/lib/matrix/loop.ts
git commit -m "Add the matrix renderer and frame loop

The renderer draws rounded cells colored by weight, then additive glow
sprites for bright cells. The loop pauses offscreen and in hidden tabs
and drops to about 30fps while idle.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Input, init, and the hero integration

**Files:**
- Create: `src/lib/matrix/input.ts`, `src/lib/matrix/index.ts`, `src/components/matrix/AttentionMatrix.astro`
- Modify: `src/components/home/Hero.astro`

**Interfaces:**
- Consumes: everything from Tasks 2 to 5.
- Produces:
  - `input.ts`: `bindInput(root: HTMLElement, canvas: HTMLCanvasElement, state: MatrixState, getGrid: () => Grid | null): () => void`
  - `index.ts`: `init(root: HTMLElement): () => void`. Expects a `canvas[data-matrix-canvas]` inside `root`. Sets `data-matrix-ready` on `root` after the first frame is drawn.
  - `AttentionMatrix.astro`: no props. Renders the canvas and initializes every `[data-matrix-root]`.

Tuning constants live at the top of `index.ts`. Task 7 may adjust their values after looking at the page.

- [ ] **Step 1: Create `src/lib/matrix/input.ts`**

```ts
import { cellAt, type Grid } from './geometry'
import { addRipple, setQuery, type MatrixState } from './state'

/**
 * Pointer and focus events on the hero → matrix state. Mouse moves the query
 * freely. Touch and pen move it only while pressed; with touch-action: pan-y
 * that means horizontal drags, and vertical drags still scroll the page. A
 * press anywhere starts a ripple. Hovering or focusing a hero link or button
 * pulls the query onto it.
 */
export function bindInput(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  state: MatrixState,
  getGrid: () => Grid | null,
): () => void {
  const local = (clientX: number, clientY: number): [number, number] => {
    const rect = canvas.getBoundingClientRect()
    return [clientX - rect.left, clientY - rect.top]
  }

  const point = (x: number, y: number) => {
    setQuery(state, x, y, performance.now())
    const grid = getGrid()
    state.hover = grid ? cellAt(grid, x, y) : -1
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && (e.buttons & 1) === 0) return
    // While over a link or button, stay snapped to it (set by onTarget).
    if ((e.target as Element | null)?.closest('a, button')) return
    point(...local(e.clientX, e.clientY))
  }

  const onDown = (e: PointerEvent) => {
    const [x, y] = local(e.clientX, e.clientY)
    point(x, y)
    addRipple(state, x, y, performance.now())
  }

  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') state.hover = -1
  }

  const onTarget = (e: Event) => {
    const target = (e.target as Element | null)?.closest('a, button')
    if (!target || !root.contains(target)) return
    const rect = target.getBoundingClientRect()
    point(...local(rect.left + rect.width / 2, rect.top + rect.height / 2))
  }

  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerdown', onDown)
  root.addEventListener('pointerleave', onLeave)
  root.addEventListener('pointerover', onTarget)
  root.addEventListener('focusin', onTarget)

  return () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerdown', onDown)
    root.removeEventListener('pointerleave', onLeave)
    root.removeEventListener('pointerover', onTarget)
    root.removeEventListener('focusin', onTarget)
  }
}
```

- [ ] **Step 2: Create `src/lib/matrix/index.ts`**

```ts
import { attentionWeights, easeToward } from './attention'
import { parseHex } from './color'
import { applyBoost, idlePoint, RIPPLE } from './effects'
import { layoutGrid, type Grid } from './geometry'
import { bindInput } from './input'
import { createLoop } from './loop'
import { createRenderer, type Palette, type Renderer } from './renderer'
import { createState, isIdle, pruneRipples } from './state'

/** Softmax temperature in cells. Higher spreads the glow wider. */
const TEMPERATURE = 1.6
/** How quickly the glow follows the query, per second. */
const EASE_RATE = 7
/** Brightness added to the hovered cell's row and column. */
const AXIS_BOOST = 0.12
const INTRO_SECONDS = 1.2
/** Height-only resizes smaller than this are the mobile address bar; ignore them. */
const RESIZE_HEIGHT_TOLERANCE = 120

function readPalette(el: Element): Palette {
  const style = getComputedStyle(el)
  const token = (name: string) => parseHex(style.getPropertyValue(name))
  return {
    line: token('--color-line'),
    accent: token('--color-accent'),
    accent2: token('--color-accent-2'),
  }
}

/** Mounts the attention matrix on the canvas inside `root`. Returns cleanup. */
export function init(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-matrix-canvas]')
  if (!canvas) return () => {}

  let renderer: Renderer
  try {
    renderer = createRenderer(canvas, readPalette(root))
  } catch {
    return () => {} // no canvas support or unreadable tokens: the CSS backdrop stays
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const state = createState()
  let grid: Grid | null = null
  let weights = new Float32Array(0)
  let target = new Float32Array(0)
  let boost = new Float32Array(0)
  let width = 0
  let height = 0
  let intro = reduced ? 1 : 0
  let clock = 0

  const updateTarget = (now: number) => {
    if (!grid) return
    if (isIdle(state, now) || !state.hasQuery) {
      const [x, y] = idlePoint(clock, grid.originX, grid.originY, grid.n * grid.pitch)
      state.query.x = x
      state.query.y = y
    }
    attentionWeights(grid.centers, grid.pitch, state.query.x, state.query.y, TEMPERATURE, target)
  }

  const draw = () => renderer.draw({ weights, boost, intro })

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const widthChanged = Math.abs(rect.width - width) > 1
    const heightChanged = Math.abs(rect.height - height) > RESIZE_HEIGHT_TOLERANCE
    if (grid && !widthChanged && !heightChanged) return
    width = rect.width
    height = rect.height
    grid = layoutGrid(width, height)
    const count = grid.n * grid.n
    weights = new Float32Array(count)
    target = new Float32Array(count)
    boost = new Float32Array(count)
    renderer.resize(grid, width, height, window.devicePixelRatio || 1)
    updateTarget(performance.now())
    weights.set(target)
    draw()
    root.dataset.matrixReady = ''
  }

  const tick = (dt: number, now: number) => {
    if (!grid) return
    clock += dt
    intro = Math.min(1, intro + dt / INTRO_SECONDS)
    updateTarget(now)
    easeToward(weights, target, EASE_RATE, dt)
    pruneRipples(state, now, RIPPLE.lifetime * 1000)
    applyBoost(boost, grid, isIdle(state, now) ? -1 : state.hover, state.ripples, now, AXIS_BOOST)
    draw()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  if (reduced) {
    return () => resizeObserver.disconnect()
  }

  const loop = createLoop(root, tick, () => intro >= 1 && isIdle(state, performance.now()))
  const unbind = bindInput(root, canvas, state, () => grid)
  const start = () => loop.start()
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })

  return () => {
    window.removeEventListener('load', start)
    loop.stop()
    unbind()
    resizeObserver.disconnect()
  }
}
```

- [ ] **Step 3: Create `src/components/matrix/AttentionMatrix.astro`**

```astro
---
// Decorative canvas for the hero. The parent element must carry
// data-matrix-root; pointer events are read from that parent.
---

<canvas
  data-matrix-canvas
  aria-hidden="true"
  class="pointer-events-none absolute inset-0 h-full w-full"
></canvas>

<script>
  import { init } from '../../lib/matrix'

  document.querySelectorAll<HTMLElement>('[data-matrix-root]').forEach((root) => init(root))
</script>
```

- [ ] **Step 4: Mount it in `src/components/home/Hero.astro`.**

Add the import below the Button import:

```ts
import AttentionMatrix from '../matrix/AttentionMatrix.astro'
```

Replace the section's opening tag, the comment, and the backdrop `<div>`:

```astro
<section class="relative isolate flex min-h-svh items-center overflow-hidden">
  <!-- Phase 2 mounts the attention matrix here. The gradient below stays as
       the fallback when JavaScript is off. -->
  <div data-hero-canvas aria-hidden="true" class="hero-backdrop absolute inset-0 -z-10"></div>
```

with:

```astro
<section
  data-matrix-root
  class="relative isolate flex min-h-svh touch-pan-y items-center overflow-hidden"
>
  <!-- The CSS backdrop shows without JavaScript and dims once the matrix
       has drawn its first frame. -->
  <div aria-hidden="true" class="absolute inset-0 -z-10">
    <div class="hero-backdrop absolute inset-0"></div>
    <AttentionMatrix />
  </div>
```

In the `<style>` block, add `transition: opacity 0.8s ease;` as the last declaration inside the existing `.hero-backdrop { … }` rule (after `mask-image`), then add this rule after it:

```css
  [data-matrix-ready] .hero-backdrop {
    opacity: 0.35;
  }
```

- [ ] **Step 5: Verify**

```bash
npm test && npm run build
echo "--- matrix JS (gzipped bytes) ---"
for f in dist/_astro/*.js; do printf "%s %s\n" "$f" "$(gzip -c "$f" | wc -c)"; done
grep -c "data-matrix-root" dist/index.html
```

Expected: all tests pass; build `0 errors`; one JS file for the matrix under 8192 gzipped bytes; `data-matrix-root` present once.

- [ ] **Step 6: Commit**

```bash
git add src/lib/matrix/input.ts src/lib/matrix/index.ts src/components/matrix/AttentionMatrix.astro src/components/home/Hero.astro
git commit -m "Mount the interactive attention matrix in the hero

The canvas follows the cursor, lights the hovered row and column,
ripples on click or tap, and drifts on its own when idle. With reduced
motion it draws one still frame, and without JavaScript the CSS
backdrop stays.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Verify and tune phase 2

**Files:** `src/lib/matrix/index.ts` and `src/components/home/Hero.astro` only if tuning is needed; `PLAN.md` status row.

This task has a controller part (browser checks and tuning judgment) and an implementer part (automated checks, any tuning edits, and the status commit).

- [ ] **Step 1: Automated checks**

```bash
npm test && npm run build
echo "--- all JS gzipped ---"; total=0; for f in dist/_astro/*.js; do s=$(gzip -c "$f" | wc -c); echo "$f $s"; total=$((total+s)); done; echo "total $total"
grep -rn "shadowBlur" src/ || echo "no shadowBlur"
grep -rnE "#[0-9a-fA-F]{3,6}\b" src/lib src/components || echo "no raw hex in lib/components"
find src -name "*.ts" -o -name "*.astro" | xargs wc -l | awk '$1>150 && $2!="total"' || true
```

Expected: tests pass; build clean; total JS under 15360 bytes gzipped; `no shadowBlur`; `no raw hex in lib/components` (test files may contain hex fixtures; hits only in `*.test.ts` are fine); no source file over 150 lines except `src/data/projects.ts` (Ruling 4, phase 1).

- [ ] **Step 2: Browser checks (controller).** With the dev server running, on `/` at 1280×800 and 375×812:
  - The matrix fades in as a diagonal wave, then drifts on its own.
  - Moving the mouse over the hero makes the glow follow with a visible trail; the hovered row and column light faintly.
  - Clicking sends a ripple; hovering or tabbing to a hero button pulls the glow onto it.
  - Hero text stays readable over the brightest cells at both widths.
  - Frame rate: count frames over 2 seconds in the page (`requestAnimationFrame` counter) while moving the pointer; expect about 60.
  - Offscreen pause: scroll the hero out of view, confirm no frames are drawn (the loop's rAF stops).
  - Reduced motion: emulate it, reload, confirm a single still frame and no listeners reacting.
  - No JS: the CSS backdrop and all hero text render.
  - No console errors.

- [ ] **Step 3: Tuning.** If the controller finds the look off (glow too tight or too wide, grid too faint, text contrast over the glow), adjust only the named constants at the top of `src/lib/matrix/index.ts` and `src/lib/matrix/renderer.ts` (`TEMPERATURE`, `EASE_RATE`, `AXIS_BOOST`, `BASE_ALPHA`, `GLOW_THRESHOLD`, `GLOW_SCALE`), or add a text scrim in `Hero.astro`. Re-run `npm test && npm run build` and commit:

```bash
git add src/lib/matrix/index.ts src/lib/matrix/renderer.ts src/components/home/Hero.astro
git commit -m "Tune the attention matrix after visual review

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Update PLAN.md status and commit.** Change the Design overhaul status row to:

```
| Design overhaul | **In progress.** Phases 1 (dark foundation) and 2 (attention matrix) done on branch `design-overhaul` |
```

```bash
git add PLAN.md
git commit -m "Mark design overhaul phase 2 complete

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

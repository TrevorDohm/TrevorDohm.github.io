# Name in the Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home hero a full-screen attention matrix that spells TREVOR / DOHM in bright cells on load, breaks apart into the roaming glow, keeps a reactive ghost of the name, dissolves at its bottom edge, and push a smaller ribbon below the fold.

**Architecture:** The square `n × n` grid becomes `cols × rows` with a caller-supplied pitch and anchor. A new pure module, `src/lib/matrix/name.ts`, owns the pixel font, the name mask, the intro timeline weights and the bottom dissolve. A build-time SVG of the name (`NameMark.astro`) is sized by CSS; at runtime the matrix reads its box to set pitch and origin, so the canvas lands exactly on the static cells.

**Tech Stack:** Astro 7.3, Tailwind CSS 4.3, TypeScript, Vitest 5, Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-10-25-name-in-the-matrix-design.md` (authority). Mockup: `docs/superpowers/specs/2026-10-22-ribbon-and-gallery-mockups/name-intro.html` (match look and timing, not code). Earlier design on this branch: `docs/superpowers/specs/2026-10-22-ribbon-and-gallery-design.md`.

## Global Constraints

- Same code rules as the ribbon plan: one job per file, under ~150 lines; pages only compose; only pages and layouts import `src/data/`; pure logic in `src/lib/` with a Vitest test beside it, written first; behaviours export `init(root: HTMLElement): () => void`.
- No libraries. Total site JS under 15 KB gzipped (7.4 KB today).
- Tokens only; no raw hex in components or `src/lib/`. Canvas colours come from tokens via `readPalette`.
- Font: 3×5 cells, M 5 wide, all other letters 3 wide, one empty column between letters. Lines `TREVOR`, `DOHM`; one empty row between them (`LINE_GAP = 1`). Name block 23 cols × 11 rows.
- Timeline: `FORM = 0.9` s, `HOLD = 1.6` s, `BREAK = 1.4` s, per-cell fade `0.5` s, `GHOST = 0.30`. Ghost cell weight after release: `max(GHOST + 0.75 × attention, attention)`.
- Bottom dissolve band: lowest 22% of rows, seeded per-cell threshold.
- Hero is `100svh`; the ribbon's top is at or below the fold. The "Philadelphia, PA" eyebrow is removed from the hero.
- The `<h1>` keeps the full name, visually hidden (`sr-only`). SVG and canvas are `aria-hidden`.
- Hero copy (tagline, role, buttons) is real text; any fade-in is opacity on `.hero-copy` children, applied only once the script is running and never under reduced motion.
- Ribbon: words `clamp(32px, 5vw, 64px)`, cells 20px radius 5px, labels 10px, section padding `3rem` vertical.
- Canvas starts after `load`; pauses offscreen and in hidden tabs; ~30fps when idle (existing `createLoop`).
- Commits: sentence case, imperative, no `feat:` prefix, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No em dashes in prose.

## Environment

Node 22 via fnm; if the sandbox refuses `eval "$(fnm env ...)"`, put fnm's Node 22 bin directory on PATH. Work in `/Users/tdohm/code/website/.claude/worktrees/ribbon-gallery` on branch `ribbon-gallery`. Never push to or merge into `master`. Don't touch `.beads/`, `AGENTS.md`, or `.superpowers/` (except report files).

## Review Focus

1. **Short or very wide screens.** Expected: name, tagline, role and buttons never overlap each other, the nav, or the dissolving bottom rows; at 2560px the name doesn't become absurdly large. Pinned by the CSS cap in Task 3 and the width sweep in Task 5.
2. **Resize mid-intro or after.** Expected: the grid re-lays out from the SVG box, the name stays on the same cells, the timeline keeps its clock (no restart, no jump). Pinned in Task 3's resize handling and Task 5.
3. **Static to live handoff.** Expected: canvas cells land on the SVG's cells to within antialiasing; layout shift 0. Pinned in Task 5.
4. **Reduced motion and JS off.** Expected: reduced motion shows the name bright and still with nothing moving; JS off shows the SVG name and all text. Pinned in Task 3 and Task 5.
5. **Phones.** Expected: ~1,500 cells keep a smooth frame rate on a throttled mobile profile; if not, the minimum pitch rises. Pinned in Task 5.

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/lib/matrix/geometry.ts` (+test) | Modify | `cols × rows` grid from pitch and anchor; `cellAt` |
| `src/lib/matrix/effects.ts` (+test) | Modify | `applyBoost`, `introAlpha`, `idlePoint` on rectangular grids |
| `src/lib/matrix/renderer.ts` | Modify | Loops over `cols × rows` |
| `src/lib/matrix/name.ts` (+test) | Create | Pixel font, name mask, timeline weights, bottom dissolve |
| `src/lib/matrix/index.ts` | Modify | Pitch and anchor from the SVG; name weights; intro clock |
| `src/components/matrix/NameMark.astro` | Create | Build-time SVG of the name in cells |
| `src/components/home/Hero.astro`, `src/pages/index.astro` | Modify | Full-screen hero, no eyebrow, sr-only h1, NameMark |
| `src/components/home/Ribbon.astro`, `RibbonItem.astro` | Modify | Smaller sizes |
| `PLAN.md` | Modify | Hero section describes the new matrix |

---

### Task 1: Rectangular grid

**Files:**
- Modify: `src/lib/matrix/geometry.ts`, `geometry.test.ts`, `effects.ts`, `effects.test.ts`, `renderer.ts`, `index.ts`

**Interfaces:**
- Produces:
  - `interface Grid { cols: number; rows: number; pitch: number; cell: number; originX: number; originY: number; centers: Float32Array }` (`n` removed)
  - `layoutGrid(width: number, height: number, pitch: number, anchorX: number, anchorY: number): Grid`: covers `[0, width] × [0, height]` edge to edge, with a cell boundary at `(anchorX, anchorY)`, so `originX = anchorX - k·pitch ≤ 0` for the smallest such k and likewise for y; `cols`/`rows` are the fewest that reach past the far edges.
  - `cellAt(grid, x, y): number` (index `row * cols + col`, or -1)
  - `introAlpha(progress, row, col, rows, cols)`, `applyBoost(boost, grid, hover, ripples, now, axisBoost)` using `cols`/`rows`
  - `idlePoint(t, x, y, width, height): [number, number]`: the existing loop, scaled to a rectangle

- [ ] **Step 1:** Update tests first.
  - `layoutGrid(1000, 600, 40, 130, 90)`: `originX` is `130 - 4·40 = -30`, `originY` is `90 - 3·40 = -30`. `cols` and `rows` reach past 1000 and 600. A centre sits at `130 + 20`.
  - `cellAt` round-trips each centre to its own index, and returns -1 outside the grid.
  - `applyBoost` on a 5×3 grid boosts exactly the hovered row (5 cells) and column (3 cells), counting the hovered cell once.
  - `introAlpha` is 0 at progress 0 and 1 at progress 1 for corner cells of a non-square grid.
  - `idlePoint` stays inside the rectangle over 0 to 60 s.
- [ ] **Step 2:** Run them and confirm they fail.
- [ ] **Step 3:** Implement. Make `renderer.ts` loop `cols * rows` and pass `rows, cols` to `introAlpha`.
- [ ] **Step 4:** Make `index.ts` compile with an interim layout: `pitch = width < 768 ? 22 : 40`, anchored at `(0, 0)`, with `idlePoint` over the full hero. Task 3 replaces this. Remove the old square-only constants (`cellsPerSide`) if nothing uses them.
- [ ] **Step 5:** `npm test && npm run build` pass.
- [ ] **Step 6:** Commit "Make the matrix grid rectangular".

### Task 2: Name, timeline and dissolve math

**Files:**
- Create: `src/lib/matrix/name.ts`, `src/lib/matrix/name.test.ts`

**Interfaces:**
- Consumes: `hash2(i, j)` from `src/lib/patterns/patterns.ts` (seeded, in [0, 1)).
- Produces:
  - `NAME_LINES = ['TREVOR', 'DOHM'] as const`
  - `LINE_GAP = 1`
  - `TIMELINE = { form: 0.9, hold: 1.6, break: 1.4, fade: 0.5, ghost: 0.3 } as const`
  - `DISSOLVE_BAND = 0.22`
  - `nameMask(lines: readonly string[], lineGap: number): { cols: number; rows: number; cells: Array<[row: number, col: number]> }`
  - `nameWeight(t: number, col: number, row: number, nameCols: number, attention: number): number`: the timeline in the spec. The form-in delay is `(col / nameCols) · 0.6 · form`, with a 0.35 s ramp. Hold weight is 0.95. Release is at `form + hold + hash2(row, col) · break`, then a linear fade over `fade` to the ghost.
  - `bottomFade(row: number, rows: number, col: number): number`: 1 above the band; inside it, `clamp01((fromBottom / DISSOLVE_BAND) · 1.6 - hash2(col, row) · 0.6)`, where `fromBottom = (rows - 1 - row) / rows`.

- [ ] **Step 1:** Write the tests first.
  - The mask is 23 × 11.
  - Row 0, cols 0 to 2 are lit (the top bar of T); col 3 is empty.
  - M occupies 5 columns.
  - DOHM starts at row 6.
  - The number of lit cells equals the count of `#` in the font table.
  - `nameWeight` is 0 at t = 0 for the last column.
  - It is 0.95 at `t = form + 0.5` for every cell.
  - At t = 10 it equals the ghost with attention 0, and is at least 0.95 with attention 1.
  - Release times differ between at least two cells.
  - `bottomFade` is 1 for row 0 and 0 for the last row, and stays in [0, 1].
- [ ] **Step 2:** Run them and confirm they fail.
- [ ] **Step 3:** Implement. Put the font in a `GLYPHS` record covering T R E V O D H M, as in the mockup.
- [ ] **Step 4:** The tests pass, and the full suite passes.
- [ ] **Step 5:** Commit "Add the pixel name, intro timeline and bottom dissolve".

### Task 3: The hero

**Files:**
- Create: `src/components/matrix/NameMark.astro`
- Modify: `src/components/home/Hero.astro`, `src/pages/index.astro`, `src/lib/matrix/index.ts`. Split into a sibling module if `index.ts` would pass ~150 lines.

**Interfaces:**
- Consumes: Task 1's `layoutGrid` and friends; Task 2's `nameMask`, `nameWeight`, `bottomFade`, `TIMELINE`; `prefersReducedMotion()`; `readPalette`.
- Produces:
  - `NameMark.astro`: an `<svg data-name-anchor viewBox="0 0 23 11" aria-hidden="true">` holding one `<path>` of all name cells. Each cell is a rounded square with the same fill fraction as the canvas (`CELL_FILL` from `geometry.ts`), filled with the top of the ramp (`accent-2` mixed toward `accent`, as the mockup's held state). Width is a responsive CSS length (spec: about 86% of the text column on phones, about 52vw on wide screens, capped by height so the copy fits above the dissolve band). `margin-bottom: calc(width / 23)`.
  - `Hero.astro`: `min-h-svh` becomes a fixed `h-svh` (or `100svh`). Remove the eyebrow, the `location` prop and its pass-through in `index.astro`. The `<h1>` holds the name with `sr-only`. `NameMark` sits in the text column above the tagline, and the column clears the fixed nav (`pt-16` or more). Remove the canvas `mask-image` (replaced by `bottomFade`). Keep the text halo.

- [ ] **Step 1: Layout from the anchor.** On each resize, read `[data-name-anchor]`'s bounding box relative to the canvas. Use `pitch = box.width / 23` and anchor `(box.left, box.top)`. If the anchor is missing or zero-sized, fall back to Task 1's interim pitch.
- [ ] **Step 2: Name cells.** Map `nameMask` cells to grid indices: `(anchorRow + r) · cols + (anchorCol + c)`.
- [ ] **Step 3: Per-frame weights.** The intro clock starts at `load`.
  - Name cells get `max(nameWeight(t, …, attention_i), …)`.
  - Other cells follow the existing attention, faded in by the existing intro wave starting at `form + 0.6 · hold`.
  - The query point starts on the name's centre and eases into `idlePoint` over `break`, unless the pointer moves first.
  - Multiply the drawn weight and alpha by `bottomFade`.
  - Make the idle throttle (`shouldThrottle`) false until `form + hold + break` has passed, so the intro runs at full frame rate.
- [ ] **Step 4: Handoff and copy.** After the first canvas frame, set `data-matrix-ready` (existing) and hide the SVG visually (`visibility: hidden`, keeping it in flow). Hero copy fades in at about `form + 0.2` via a JS-set attribute; without JS and under reduced motion it is simply visible.
- [ ] **Step 5: Reduced motion.** Draw one static frame: name cells at the hold weight, others at rest, bottom dissolve applied, then stop.
- [ ] **Step 6: Resize.** Re-lay out from the anchor without resetting the intro clock or the eased weights. Reallocate arrays only when `cols × rows` changes, and copy the name state across.
- [ ] **Step 7: Verify.** `npm test && npm run build`. Then a headless-Chrome smoke check at 390, 1440 and 2560:
  - the name is lit at about 1.5 s
  - a ghost remains at about 6 s
  - no overlap between name, copy and nav
  - the ribbon's top is at or below `innerHeight`
  - with JS off, the SVG name is visible
- [ ] **Step 8:** Commit "Spell the name in the hero matrix".

### Task 4: Smaller ribbon

**Files:**
- Modify: `src/components/home/RibbonItem.astro`, `src/components/home/Ribbon.astro`

- [ ] **Step 1:** Apply the sizes from Global Constraints.
- [ ] **Step 2:** `npm run build` passes. In headless Chrome at 1440, more items are visible per row than before (count them), and the measured speeds are still 22 and 30 px/s.
- [ ] **Step 3:** Commit "Shrink the ribbon so more words fit".

### Task 5: Verify and record

**Files:**
- Modify: `PLAN.md`

- [ ] **Step 1: Browser checks.** In headless Chrome on `npm run preview`, check the spec's "Done means" in full:
  - legibility at 375, 768, 1440 and 2560 across all phases, with screenshots at 1.5 s and 6 s
  - the ribbon below the fold
  - the SVG to canvas handoff (pixel compare, layout shift)
  - JS off and reduced motion
  - Lighthouse mobile
  - JS gzip total
  - a frame-rate sample under the Moto G Power mobile profile with 4× CPU throttle
- [ ] **Step 2: PLAN.md.** Update the hero section and decisions table:
  - the centerpiece is now the name in the matrix
  - the grid is full-screen and sized by the name
  - the eyebrow is removed
  - the bottom dissolve replaces the mask

  Add a stage row "Name in the matrix" with today's date. Say "verified in Chrome only".
- [ ] **Step 3:** Commit "Record the name-in-the-matrix hero in the plan".

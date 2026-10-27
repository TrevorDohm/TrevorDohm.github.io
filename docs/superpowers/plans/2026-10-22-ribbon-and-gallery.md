# Word Ribbon and Attention Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a drifting word ribbon under the home hero and a drifting gallery of live attention-pattern cards above Contact, both pausable, accessible, and static without JS or with reduced motion.

**Architecture:** A shared marquee behavior (`src/lib/marquee/`) moves any server-rendered row of items with CSS keyframes and controls speed, hover easing, pause, and offscreen pausing through the Web Animations API. The ribbon is plain markup on top of it. The gallery adds `src/lib/patterns/`: pure pattern math used twice, at build time to render a static SVG frame per card and at runtime to animate a canvas over it, reusing the matrix's frame loop and color ramp.

**Tech Stack:** Astro 7.3, Tailwind CSS 4.3, TypeScript, Vitest 5, CSS animations, Web Animations API, Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-10-22-ribbon-and-gallery-design.md`. Approved mockups are in `docs/superpowers/specs/2026-10-22-ribbon-and-gallery-mockups/` (`ribbon.html` panel 2, `gallery.html`). Match their look and motion, not their code. Where text and mockup disagree, the spec text wins.

## Global Constraints

- No UI frameworks or animation libraries. Client JS is plain TypeScript. Total site JS under 15 KB gzipped (about 3.2 KB today).
- Code rules (`CLAUDE.md`): one job per file, under ~150 lines; pages only compose; only pages and layouts import `src/data/` (type-only imports are fine anywhere); pure logic in `src/lib/` with a Vitest test beside it, written first; every client behavior exports `init(root: HTMLElement): () => void` and stays inside its root.
- Tokens only, no raw hex in components or `src/lib/`. New tokens: `--color-bake: #e28d23`, `--color-hike: #2ab580`.
- Category colors: ml = `accent`, mba = `accent-2`, bake = `bake`, hike = `hike`.
- Speeds: ribbon row 1 drifts left at 22 px/s, row 2 right at 30 px/s; gallery drifts left at 18 px/s. Hover eases playback rate to 0.25.
- Pause control is a visible button, first in tab order in its section. Paused stays paused until Play. Pause stops all motion in its section, including the gallery sweep.
- No motion unless the script has run and set `data-marquee-ready` on the root. JS off and reduced motion share one static mode: no animation, clone hidden, button hidden, row horizontally scrollable with `tabindex="0"`, `role="region"`, `aria-label`.
- Clone track, and any copies added at runtime: `inert` and `aria-hidden="true"`. The first track is a real `<ul>`.
- Inert content gets no pointer events, and about half the visible items are clones. So hover effects never use `:hover` alone. The marquee script hit-tests items on `pointermove` over the row and sets `data-hover` on the `<li>` under the pointer, in either list, and CSS styles `:hover, [data-hover]`.
- Animation `currentTime` values are in milliseconds.
- Section wrappers get `overflow-x: clip`. No `will-change` on tracks. Glow via `box-shadow`, never `filter: blur`.
- Animations start after the window `load` event.
- Gallery cards: 12×12 map, query row sweeps at 1.6 rows/s, one shared loop capped at ~30fps, only visible cards drawn, clone canvases mirrored with `drawImage`.
- Ribbon hike item "Paintbrush Divide" is confirmed by Trevor.
- Copy, docs and commit messages follow `no-ai-slop`: no em dashes in prose. Commits: sentence case, imperative, no `feat:` prefix, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Environment

Prefix Node commands with:

```bash
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH" && eval "$(fnm env --shell zsh)" && fnm use 22 >/dev/null
```

Work in the worktree `/Users/tdohm/code/website/.claude/worktrees/ribbon-gallery` on branch `ribbon-gallery`. Never push to or merge into `master` (it deploys the live site). Don't touch `.beads/`, `.superpowers/`, or `AGENTS.md`. Run `npm install` once if `node_modules` is missing in the worktree.

## Review Focus

1. **Fonts load after the first measurement.** Geist swaps in, track width changes, duration is recomputed. Expected: speed stays constant and the row does not jump. Pinned by `rescaleCurrentTime` tests (Task 2) and the font check in Task 5.
2. **Very wide screens (2560px and up) with the smallest type.** Expected: no empty gap or seam ever shows. Pinned by `repeatsNeeded` tests (Task 2) and the 2560px check in Task 5.
3. **User pauses, then scrolls away and back or switches tabs.** Expected: still paused on return. Offscreen and hidden-tab pausing must never resume a user pause. Pinned by the pause check in Task 5.
4. **Keyboard user tabs to the Cottention link while the strip moves.** Expected: the strip stops while focus is inside it, so the focused card does not slide away. Pinned by the focus check in Task 8.
5. **Uneven or tiny item lists.** Expected: every item appears once, rows differ in length by at most 1, no adjacent repeats where avoidable, and empty input does not throw. Pinned by `itemsByRow` tests (Task 2).

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/styles/tokens.css` | Modify | `--color-bake`, `--color-hike` |
| `src/styles/motion.css` | Modify | `marquee` keyframes |
| `src/lib/motion/prefers-reduced-motion.ts` | Create | Shared reduced-motion check |
| `src/lib/matrix/palette.ts` | Create | `readPalette`, moved out of `index.ts` |
| `src/lib/matrix/index.ts` | Modify | Use the shared check; import `readPalette` |
| `src/data/interests.ts` | Create | Ribbon items; Bresnan role as their source |
| `src/data/patterns.ts` | Create | Gallery card copy |
| `src/lib/marquee/math.ts` (+test) | Create | Duration, repeats, time rescale, rate easing |
| `src/lib/marquee/rows.ts` (+test) | Create | Interleave items into rows |
| `src/lib/marquee/timing.ts` | Create | Measure rows, add copies, set and rescale durations |
| `src/lib/marquee/index.ts` | Create | `init(root)`: start, hover rate and hit-test, pause, offscreen, focus |
| `src/components/ui/MarqueeRow.astro` | Create | One masked row: track `<ul>` + inert clone, static-mode CSS |
| `src/components/home/Ribbon.astro` | Create | Ribbon section, pause button, two rows |
| `src/components/home/RibbonItem.astro` | Create | Cell + label + word |
| `src/lib/patterns/patterns.ts` (+test) | Create | Pattern weights, sweep, hash |
| `src/lib/patterns/geometry.ts` (+test) | Create | Cell rectangles; CSS ramp color |
| `src/lib/patterns/draw.ts` | Create | Draws one map to a canvas |
| `src/lib/patterns/index.ts` | Create | `init(root)`: shared loop, sweep, hover query |
| `src/components/ui/PatternCard.astro` | Create | Static SVG frame + canvas + text |
| `src/components/home/Gallery.astro` | Create | Gallery section |
| `src/pages/index.astro` | Modify | Compose Ribbon and Gallery |
| `PLAN.md` | Modify | Palette rows, decisions, phase table |

---

### Task 1: Tokens, shared reduced-motion check, and ribbon data

**Files:**
- Modify: `src/styles/tokens.css`, `src/lib/matrix/index.ts:18-26, 40`
- Create: `src/lib/motion/prefers-reduced-motion.ts`, `src/lib/matrix/palette.ts`, `src/data/interests.ts`

**Interfaces:**
- Produces: `prefersReducedMotion(): boolean`; `readPalette(el: Element): Palette` from `src/lib/matrix/palette.ts` (`Palette` is the type in `renderer.ts`; `readPalette` throws if a token is unreadable, so callers wrap it in try/catch as `index.ts` already does); `type InterestCategory = 'ml' | 'mba' | 'bake' | 'hike'`; `interface Interest { label: string; category: InterestCategory }`; `interests: Interest[]`; `bakingRole` (`{ org, role, location, period }`).

- [ ] **Step 1: Add the tokens.** In the first `@theme` block of `tokens.css`, after `--color-accent-2`, add `--color-bake: #e28d23;` and `--color-hike: #2ab580;`, with a comment noting both sit at about 7.7:1 on `background`, like the accents.

- [ ] **Step 2: Create `prefersReducedMotion()`** in `src/lib/motion/prefers-reduced-motion.ts`, returning `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. It is DOM wiring, so it has no test. Replace the inline `matchMedia` call in `src/lib/matrix/index.ts` with it. Move `readPalette` unchanged into `src/lib/matrix/palette.ts` and import it back into `index.ts`.

- [ ] **Step 3: Create `src/data/interests.ts`** with the types above and this exact list (order does not matter; Task 2 interleaves it):
  - ml: Cottention, CUDA Kernels, Linear Transformers, Triton, Agents, Air-Gapped LLMs
  - mba: Wharton, Quant Finance, Options Pricing, Black–Scholes
  - bake: Blueberry Yuzu Cookies, Raspberry Kouign Amann, Piña Colada Danish, Orange Cardamom Morning Bun, Country Sourdough, Lamination at 3 a.m.
  - hike: Half Dome, Angel's Landing, The Wave, Paintbrush Divide

  Also export `bakingRole = { org: 'Bresnan Bread & Pastry', role: 'Operations Lead, Overnight Pastry Baker', location: 'McKinney, TX', period: '2025 – 2026' }`, with a doc comment that it is the source for the bake items and is not rendered yet. All four fields come from Trevor's MBA resume ("Operations Lead – Overnight Pastry Baker, Bresnan Bread & Pastry, McKinney, TX (2025 – 2026)"). Use a typographic apostrophe in "Angel’s Landing".

- [ ] **Step 4: Verify.** Run `npm test && npm run build`. Expected: 45 tests pass, build reports 0 errors. The hero behaves as before (`npm run dev`, load `/`, the matrix animates).

- [ ] **Step 5: Commit** with the message "Add category color tokens and ribbon data".

---

### Task 2: Pure marquee math and row interleaving

**Files:**
- Create: `src/lib/marquee/math.ts`, `src/lib/marquee/math.test.ts`, `src/lib/marquee/rows.ts`, `src/lib/marquee/rows.test.ts`

**Interfaces:**
- Produces:
  - `durationSeconds(trackPx: number, pxPerSec: number): number`
  - `repeatsNeeded(contentPx: number, viewportPx: number): number`
  - `rescaleCurrentTime(t: number, oldDur: number, newDur: number): number`
  - `approach(current: number, target: number, ratePerSec: number, dtSeconds: number): number`
  - `itemsByRow<T extends { category: string }>(items: readonly T[], rows: number, order: readonly string[]): T[][]`

- [ ] **Step 1: Write the failing tests** in `math.test.ts`:

```ts
describe('durationSeconds', () => {
  it('is width over speed', () => expect(durationSeconds(6600, 22)).toBe(300))
  it('is 0 for zero, negative or non-finite input', () => {
    for (const [w, s] of [[0, 22], [100, 0], [-5, 22], [NaN, 22], [100, Infinity]])
      expect(durationSeconds(w, s)).toBe(0)
  })
})
describe('repeatsNeeded', () => {
  it('is 1 when content already covers the viewport', () => expect(repeatsNeeded(3000, 2560)).toBe(1))
  it('repeats short content until it covers the viewport', () => expect(repeatsNeeded(1000, 2560)).toBe(3))
  it('is 1 for zero or non-finite content width', () => {
    expect(repeatsNeeded(0, 2560)).toBe(1)
    expect(repeatsNeeded(NaN, 2560)).toBe(1)
  })
})
describe('rescaleCurrentTime', () => {
  it('keeps the progress fraction', () => expect(rescaleCurrentTime(30, 120, 150)).toBeCloseTo(37.5))
  it('wraps times past one loop', () => expect(rescaleCurrentTime(150, 120, 120)).toBeCloseTo(30))
  it('is 0 when the old duration is not positive', () => expect(rescaleCurrentTime(10, 0, 100)).toBe(0))
})
describe('approach', () => {
  it('moves 1 - e^-rate*dt of the way', () => expect(approach(1, 0.25, 4, 0.25)).toBeCloseTo(0.25 + 0.75 * Math.exp(-1)))
  it('is frame-rate independent', () => {
    let a = 1; for (let i = 0; i < 2; i++) a = approach(a, 0.25, 4, 0.1)
    expect(a).toBeCloseTo(approach(1, 0.25, 4, 0.2))
  })
})
```

And in `rows.test.ts`, with `ORDER = ['ml', 'bake', 'mba', 'hike']`. Use a local fixture with the real data's category counts: ml 6, bake 6, mba 4, hike 4, labels `ml1`…`hike4`. Don't import `src/data/` (CLAUDE.md rule 3). A comment should say the fixture must track those counts:

```ts
it('places every item exactly once', ...)            // flattened rows, sorted labels equal input
it('keeps row lengths within 1 of each other', ...)  // for 20 items/2 rows, and 3 items/2 rows
it('never puts the same category side by side for the 6/6/4/4 fixture', ...)
  // check i and i+1 in each row, and the loop seam (last item next to first)
it('returns empty rows for empty input', () => expect(itemsByRow([], 2, ORDER)).toEqual([[], []]))
```

- [ ] **Step 2: Run** `npx vitest run src/lib/marquee`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `math.ts`.** `approach` uses the same `1 - exp(-rate * dt)` factor as `easeToward` in `src/lib/matrix/attention.ts`. Implement `itemsByRow` in `rows.ts` with this algorithm. It is not obvious from the signature: dealing alternately would put only two categories in each row.

```ts
// 1. Group items by category, preserving input order.
// 2. Build one sequence by taking the next item from each category in `order`,
//    round-robin, skipping categories that have run out.
// 3. Split the sequence into `rows` contiguous chunks whose lengths differ by at most 1
//    (the first rows get the extra item).
```

- [ ] **Step 4: Run** `npx vitest run src/lib/marquee`. Expected: PASS. The expected rows are `ml bake mba hike ml bake mba hike ml bake` and `mba hike ml bake mba hike ml bake ml bake`.

- [ ] **Step 5: Commit** with the message "Add marquee timing math and row interleaving".

---

### Task 3: Marquee behavior and the shared row component

**Files:**
- Create: `src/lib/marquee/timing.ts`, `src/lib/marquee/index.ts`, `src/components/ui/MarqueeRow.astro`
- Modify: `src/styles/motion.css`

**Interfaces:**
- Consumes: Task 2's `math.ts`; `prefersReducedMotion()`.
- Produces:
  - `init(root: HTMLElement): () => void` from `src/lib/marquee/index.ts`
  - `MarqueeRow.astro`, with props `{ speed: number; reverse?: boolean; label: string; gap?: string }` and a default slot of `<li>` items
  - the DOM contract:
    - the root carries `data-marquee-root`
    - the toggle is `button[data-marquee-toggle]` inside the root
    - each row is `[data-marquee-row][data-speed]` and contains `ul[data-marquee-track]` plus `ul[data-marquee-clone]`
  - root states set by the script: `data-marquee-ready` and `data-marquee-paused`
  - `data-hover` on the `<li>` under the pointer
  - a `marquee:layout` event (a `CustomEvent`) dispatched on the root each time copies are added or durations change
  - `layoutRow(row: HTMLElement, speed: number, viewportPx: number): void` from `timing.ts`

- [ ] **Step 1: Add the keyframes** to `motion.css`, above the reduced-motion block: `@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-100%) } }`.

- [ ] **Step 2: Create `MarqueeRow.astro`.** It renders:
  - a `div[data-marquee-row]` carrying `data-speed`, `role="region"`, `tabindex="0"` and `aria-label={label}`
  - inside it, a `ul[data-marquee-track]` holding the slot
  - a `ul[data-marquee-clone]` with `inert` and `aria-hidden="true"`, filled from `await Astro.slots.render('default')` via `set:html`

  `gap` (default `2rem`) is the space between items and also the track's `padding-right`, so the seam gap matches.

  Static mode (the default in its `<style>`):
  - row: `overflow-x: auto`
  - clone: `display: none`
  - track: `display: flex`, `width: max-content`

  Layout in both modes:
  - row: `display: flex`, `padding-block: 8px` (room for the 4px card lift)
  - both lists: `display: flex`, `flex-shrink: 0`, `width: max-content`, `gap` and `padding-right` set to `gap`, items centered, no list bullets or margin
  - item heights come from fixed `font-size` and `line-height` (or fixed card sizes), so a font swap cannot change row height. This is the spec's "reserve row height".

  Ready mode, under `:global([data-marquee-ready])`:
  - row: `overflow: hidden` and the eased mask, as in the mockup (`transparent, #0003 32px, #000 96px, …` mirrored). Write it with `rgb(0 0 0 / 0.2)` and `black` in place of the hex shorthands, since mask stops are alpha only.
  - clone: shown, side by side with the track
  - both tracks: `animation: marquee var(--marquee-duration, 0s) linear infinite`, with `animation-direction: reverse` when `reverse` is set

  Do not rely on the global reduced-motion rule; ready mode is never entered under reduced motion.

- [ ] **Step 3: Implement `layoutRow`** in `src/lib/marquee/timing.ts`:
  - Measure the width of one copy of the content: the track's `scrollWidth` before any copies are added. Store it on the row so later calls start from the original width.
  - If `repeatsNeeded(contentWidth, viewportPx)` is more than 1, add the missing copies of the original children to both track and clone. Mark every added element `inert` and `aria-hidden="true"`, since added copies may contain links.
  - **Re-measure** the track's `scrollWidth` after adding copies, and set `--marquee-duration` on the row to `durationSeconds(trackWidth, speed)` seconds.
  - If the duration changed and the row has running animations, set each one's `currentTime` (in ms) with `rescaleCurrentTime`, so it does not jump.

- [ ] **Step 4: Implement `init(root)`** in `src/lib/marquee/index.ts`:
  - **Reduced motion:** return a no-op cleanup if `prefersReducedMotion()` is true or the root has no rows.
  - **Layout:** call `layoutRow` for each row now, on `document.fonts.ready`, and from a `ResizeObserver` on the root. Dispatch `marquee:layout` on the root after each pass.
  - **Hover hit-testing:** `pointermove` on each row finds the `<li>`, in either list, whose `getBoundingClientRect()` contains the pointer, and moves `data-hover` to it. `pointerleave` clears it.
  - **Start:** after the window `load` event (immediately if `document.readyState === 'complete'`):
    - set `root.dataset.marqueeReady`
    - remove `role` and `tabindex` from the rows (they no longer scroll)
    - unhide the toggle
  - **Rate:** keep `rate` and `target`.
    - `pointerenter` sets the target to 0.25 and `pointerleave` sets it to 1.
    - `focusin` within a row sets a `focusHeld` flag that pauses the animations. `focusout` clears it.
    - While `rate` differs from `target` by more than 0.001, run a rAF that applies `approach(rate, target, 4, dt)` and calls `updatePlaybackRate(rate)` on every animation from `track.getAnimations()` and `clone.getAnimations()`. Once settled, snap `rate = target`, apply it once more, and stop the rAF.
  - **Pause:** the toggle flips `userPaused`, swaps its text between "Pause" and "Play", and sets or removes `data-marquee-paused` on the root.
    - One function `sync()` plays the animations only when not `userPaused`, not `focusHeld`, on screen (IntersectionObserver on the root) and `!document.hidden`; otherwise it pauses them.
    - Offscreen and hidden-tab changes call `sync()` and never touch `userPaused`.
  - **Cleanup:** disconnect the observers, remove the listeners, cancel the rAF, and remove `data-marquee-ready` and `data-marquee-paused`.

- [ ] **Step 5: Verify** with `npm run build`, and check that both `timing.ts` and `index.ts` are under ~150 lines. Expected: 0 errors. Behavior is checked in Task 5, once a section uses the row.

- [ ] **Step 6: Commit** with the message "Add the shared marquee row and its behavior".

---

### Task 4: The ribbon section

**Files:**
- Create: `src/components/home/Ribbon.astro`, `src/components/home/RibbonItem.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `MarqueeRow.astro` and its DOM contract; `itemsByRow`; `init` from `src/lib/marquee`; `Interest` type.
- Produces: `Ribbon.astro`, with props `{ items: Interest[] }`.

- [ ] **Step 1: Create `RibbonItem.astro`** (props `{ item: Interest; outlined: boolean }`). It renders an `<li>` holding:
  - the cell group, then the word, matching mockup panel 2
  - cell group: a 28px rounded cell (radius 7px) filled with `var(--cat)`, glowing with `box-shadow: 0 0 14px color-mix(in srgb, var(--cat) 40%, transparent)`, kept dimmer than the hero matrix
  - under the cell, the category as an 11px uppercase mono label in `var(--cat)`
  - the word at `clamp(48px, 8vw, 104px)`, weight 600, letter-spacing `-0.035em`

  Outlined words are transparent with a 1px text stroke. The stroke color must not be `line`: use `muted` at rest and `var(--cat)` on `:hover, [data-hover]`, so the outline passes as text. Map `--cat` from `data-category`: ml to `--color-accent`, mba to `--color-accent-2`, bake to `--color-bake`, hike to `--color-hike`.

- [ ] **Step 2: Create `Ribbon.astro`.**
  - It calls `itemsByRow(items, 2, ['ml', 'bake', 'mba', 'hike'])`, the order Task 2 settled.
  - It renders a `<section data-marquee-root aria-label="Things I work on and love">` with `overflow-x: clip` and vertical padding.
  - Inside: a `button[data-marquee-toggle]` with `hidden`, `type="button"` and text "Pause" (no `aria-pressed`; the label swap carries the state), styled as the mockup's mono pill, top right, first in the section's DOM order.
  - Then two `MarqueeRow`s:
    - row 0: speed 22, label "Interests, first row"
    - row 1: speed 30, `reverse`, label "Interests, second row"

    Each row alternates `outlined` by item index.
  - A `<script>` imports `init` from `../../lib/marquee` and runs it on every `[data-marquee-root]`, following `AttentionMatrix.astro`.

- [ ] **Step 3: Compose it.** In `index.astro`, import `interests` and render `<Ribbon items={interests} />` between `<Hero …/>` and `<SelectedWork …/>`.

- [ ] **Step 4: Verify** with `npm test && npm run build`. Expected: all tests pass, 0 errors.

- [ ] **Step 5: Commit** with the message "Add the word ribbon under the hero".

---

### Task 5: Verify and ship the ribbon stage

**Files:**
- Modify: `PLAN.md`

- [ ] **Step 1: Check in a real browser** with `npm run dev` and Chrome DevTools. Each item lists the check, then what should happen:
  - **Speed.** Read `getAnimations()[0].effect.getComputedTiming().duration` and the track width; width divided by seconds should be 22 and 30 px/s, within ±10%.
  - **Fonts.** Reload with the cache disabled and network throttled to Fast 4G. Speed should be the same after fonts load, with no visible jump (Review Focus 1).
  - **Seams.** At 375, 1440 and 2560px wide, watch one full loop of each row. There should be no gap and no seam (Review Focus 2).
  - **Hover.** Pointer over the ribbon; the rows should ease to about quarter speed, not snap. Hover outlined words in both the original and the clone half; each should tint.
  - **Pause.** Press Pause, scroll the ribbon offscreen and back, switch tabs and return. It should still be paused, with the button reading "Play". Press Play and it resumes (Review Focus 3).
  - **Reduced motion.** Emulate it in Rendering. Nothing should move, the button should be hidden, no clone should be visible, and each row should be scrollable by keyboard (Tab to it, then arrow keys).
  - **JS off.** Disable JavaScript. The result should match reduced motion, and every word should be readable by scrolling.
  - **Narrow screens.** At 375px the page must not scroll horizontally (`document.documentElement.scrollWidth === innerWidth`).
  - **Screen reader.** VoiceOver should read each item once, with nothing read from the clone.
  - **Offscreen.** In a Performance trace with the ribbon offscreen, there should be no ribbon animation frames.

- [ ] **Step 2: Run Lighthouse** (mobile) on `npm run build && npm run preview`. Expected: Accessibility 100, with no `scrollable-region-focusable` failure. Note the Performance score and CLS in the commit message.

- [ ] **Step 3: Update `PLAN.md`.**
  - Add `bake` and `hike` rows to the palette table: `#E28D23`, bake category color, 7.73:1; `#2AB580`, hike category color, 7.68:1.
  - Add a "Word ribbon and attention gallery" row to the decisions table that links the spec and gives the page order: Hero, stats strip, Ribbon, Selected Work, Gallery, Contact.
  - In the phase table, add a "Ribbon and gallery" stage marked "Ribbon done" and fix the stale status line: phases 1 and 2 are merged to `master` and live.

- [ ] **Step 4: Commit** with the message "Mark the ribbon stage complete in the plan". The ribbon can ship from here independently of the gallery.

---

### Task 6: Pure pattern math and cell geometry

**Files:**
- Create: `src/lib/patterns/patterns.ts`, `src/lib/patterns/patterns.test.ts`, `src/lib/patterns/geometry.ts`, `src/lib/patterns/geometry.test.ts`

**Interfaces:**
- Consumes: `RAMP_SPLIT` from `src/lib/matrix/color.ts`.
- Produces:
  - `type PatternId = 'full' | 'causal' | 'window' | 'sparse' | 'cosine' | 'induction'`
  - `hash2(i: number, j: number): number`
  - `patternWeights(id: PatternId, n: number): Float32Array`
  - `sweepWeights(base: Float32Array, n: number, queryRow: number, out: Float32Array): Float32Array`
  - `SWEEP_FLOOR = 0.28`, `SWEEP_SPREAD = 1.2`
  - `cellRect(i: number, j: number, n: number, size: number): { x: number; y: number; w: number; r: number }`
  - `rampMix(w: number): string`

- [ ] **Step 1: Write the failing tests.** In `patterns.test.ts`, with `N = 12` and `W = (id) => patternWeights(id, N)`:

```ts
it('hash2 is deterministic and in [0, 1)', ...)           // same input twice equal; 0 <= v < 1 over a 12x12 sweep
it('every pattern has row max 1 or an all-zero row', ...)  // for each id, each row
it('patternWeights is deterministic', ...)                 // two calls toEqual
it('causal is zero above the diagonal', ...)               // j > i => 0
it('window is zero beyond distance 2', ...)                // |i - j| > 2 => 0
it('sparse keeps row 0 and column 0 global', ...)          // all > 0
it('full peaks on the diagonal', ...)                      // W('full')[i*N+i] === 1
it('induction peaks 4 back from the diagonal', ...)        // for i >= 4, argmax of row i is i - 4
it('cosine is non-negative everywhere', ...)
it('sweep keeps the query row at full weight and dims far rows to the floor', () => {
  const base = W('full'); const out = sweepWeights(base, N, 6.5, new Float32Array(N * N))
  expect(out[6 * N + 6]).toBeCloseTo(base[6 * N + 6])
  expect(out[0]).toBeCloseTo(base[0] * SWEEP_FLOOR)
})
```

In `geometry.test.ts`:

```ts
it('cells tile the square with a 10/424 padding and 16% gap', ...)
  // size 424, n 12: pitch = (424 - 2*10)/12; cellRect(0,0).x === 10 + pitch*0.08; w === pitch*0.84
it('cell radius scales with size', ...)                    // r === 5 * size / 424
it('rampMix below the split mixes line into accent', () =>
  expect(rampMix(0.3)).toBe('color-mix(in srgb, var(--color-accent) 50%, var(--color-line))'))
it('rampMix above the split mixes accent into accent-2', () =>
  expect(rampMix(0.8)).toBe('color-mix(in srgb, var(--color-accent-2) 50%, var(--color-accent))'))
it('rampMix clamps out-of-range weights', ...)             // -1 => 0% accent; 2 => 100% accent-2
```

- [ ] **Step 2: Run** `npx vitest run src/lib/patterns`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement.**
  - `hash2` uses integer mixing through `Math.imul`, not `Math.sin`, so values match across engines.
  - The weight formulas start from `gallery.html`. Each must stay recognizable at 12×12 and pass the tests.
  - Normalize each row by its own max.
  - `sweepWeights` sets `out[k] = base[k] * (SWEEP_FLOOR + (1 - SWEEP_FLOOR) * near)`, where `near = max(0, 1 - |i + 0.5 - queryRow| / SWEEP_SPREAD)`.
  - `rampMix` mirrors `rampColor` in `color.ts` as CSS: an sRGB mix of the same token pairs at the same split, with percentages rounded to whole numbers. It lets the build-time SVG use tokens instead of hex.

- [ ] **Step 4: Run** `npx vitest run src/lib/patterns`. Expected: PASS.

- [ ] **Step 5: Commit** with the message "Add attention pattern math and card geometry".

---

### Task 7: Gallery cards, runtime drawing, and the gallery section

**Files:**
- Create: `src/data/patterns.ts`, `src/lib/patterns/draw.ts`, `src/lib/patterns/index.ts`, `src/components/ui/PatternCard.astro`, `src/components/home/Gallery.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes:
  - Task 6's functions
  - `createLoop` from `src/lib/matrix/loop.ts`, `easeToward` from `src/lib/matrix/attention.ts`, `rampColor` from `src/lib/matrix/color.ts`, `readPalette` from `src/lib/matrix/palette.ts`
  - `prefersReducedMotion()`
  - `MarqueeRow.astro` and marquee `init`
- Produces:
  - `interface PatternCardData { id: PatternId; name: string; kind: string; caption: string; href?: string }` and `patterns: PatternCardData[]`
  - `Gallery.astro`, with props `{ cards: PatternCardData[] }`
  - `PatternCard.astro`, with props `{ card: PatternCardData }`
  - `drawPattern(ctx: CanvasRenderingContext2D, weights: Float32Array, n: number, size: number, palette: Palette): void`
  - `init(root: HTMLElement): () => void` from `src/lib/patterns/index.ts`

- [ ] **Step 1: Create `src/data/patterns.ts`.** Use the spec's table, in its order, with these names, kinds and captions verbatim. Cottention gets `href: 'https://arxiv.org/abs/2409.18747'` (the paper link in `projects.ts`). Run the captions past the `no-ai-slop` rules. Each caption has to stay one line of plain language, and the Cottention caption must keep the "linear memory in sequence length" claim, which traces to `projects.ts`.

- [ ] **Step 2: Create `PatternCard.astro`.** It renders an `<li>` card, about 240px wide, as a `surface` panel with a `line` border and 14px radius, holding:
  - **The map:** a square box containing, at build time, an inline `<svg viewBox="0 0 424 424" aria-hidden="true">` with one `<rect>` per cell, positioned by `cellRect` and weighted by `sweepWeights(patternWeights(id, 12), 12, 6, …)`. A `<canvas data-pattern={id} width="424" height="424" aria-hidden="true">` sits absolutely over the SVG.

  To keep the HTML small (about 1,700 rects counting the clone):
  - round rect coordinates to 2 decimals
  - quantize each weight to 11 levels, `round(w * 10)`, and set `style="fill:var(--w{level})"` on the rect
  - define `--w0` to `--w10` once on the gallery section as `rampMix(level / 10)`
  - **The text:** a name / kind row, then the caption in `muted`.

  If `href` is set:
  - the name becomes a link with `↗`
  - the card gets an `accent`-tinted border, as in the mockup

  On `:hover, [data-hover]` the card lifts 4px over 0.4s. While the card has `data-pattern-live`, the SVG is hidden.

- [ ] **Step 3: Implement `drawPattern`** in `draw.ts`. It clears the canvas, then draws a rounded rect for each cell at `cellRect`, filled with `rampColor(min(1, w), palette.line, palette.accent, palette.accent2)`.

- [ ] **Step 4: Implement `init(root)`** in `src/lib/patterns/index.ts`.
  - **Reduced motion:** return a no-op cleanup if `prefersReducedMotion()` is true, so the static SVG stays.
  - **Palette:** read it with `readPalette(root)` inside try/catch. On failure, return a no-op cleanup so the static SVGs stay.
  - **Card state:** key cards by pattern id. The *primary* canvas for an id is the first `canvas[data-pattern=id]` inside `[data-marquee-track]`. Every other canvas with that id is a *mirror*: those in the clone and in runtime copies.
  - For each id, store `base = patternWeights(id, 12)`, `current` (initialized to the static frame), `target`, `queryRow`, and its list of mirrors. The starting `queryRow` is staggered by card index (`index * 2 % 12`), so the cards don't sweep in lockstep.
  - **Re-collect** primaries and mirrors, and re-observe them, on every `marquee:layout` event, since the marquee may add copies after this init runs.
  - **Visibility:** one IntersectionObserver over every canvas tracks which are visible.
  - **Frame loop:** `createLoop(root, tick, () => true)`, which caps it at about 30fps. `tick(dt)`:
    - returns early if the root has `data-marquee-paused`
    - for each id with any visible canvas:
      - `queryRow = hoverRow ?? (queryRow + 1.6 * dt) % 12`
      - `sweepWeights` into `target`
      - `easeToward(current, target, 6, dt)`
      - `drawPattern` to the primary
      - for each visible mirror, `clearRect`, then `drawImage(primary, 0, 0)`
    - after a canvas is first drawn, sets `data-pattern-live` on its card
  - **Hover:** inert mirrors get no pointer events, so `pointermove` on the row finds the canvas, in any list, whose rect contains the pointer. It sets that id's `hoverRow = clamp((clientY - top) / height * 12, 0, 11.99)` and clears the others. `pointerleave` on the row clears all.
  - **Start:** after `load`, like the marquee. The gallery script runs the marquee init before this one.
  - **Cleanup:** stop the loop, disconnect the observer, remove the listeners, and remove `data-pattern-live`.

- [ ] **Step 5: Create `Gallery.astro`.**
  - It renders a `<section data-marquee-root data-gallery aria-label="Ways to pay attention">` with `overflow-x: clip`. `SectionHeading` has no `id` prop, so use `aria-label` rather than `aria-labelledby`.
  - At the top, a row with:
    - `SectionHeading`, eyebrow "How models look at text" and title "Ways to pay attention"
    - the marquee toggle button, as in the ribbon
  - Under it, one `MarqueeRow`: speed 18, label "Attention patterns", gap `1.25rem`, holding a `PatternCard` per card.
  - Its `<script>` runs both `init`s (marquee and patterns) on each `[data-marquee-root]` that contains `canvas[data-pattern]`.

  The ribbon's script already initializes the marquee on every `[data-marquee-root]`. To keep a section from being initialized twice:
  - the ribbon's script selects only `[data-marquee-root]:not([data-gallery])`
  - the gallery root carries `data-gallery`
  - edit `Ribbon.astro`'s selector accordingly

- [ ] **Step 6: Compose it.** In `index.astro`, import `patterns` and render `<Gallery cards={patterns} />` between `<SelectedWork …/>` and `<Contact …/>`.

- [ ] **Step 7: Verify** with `npm test && npm run build`. Expected: all tests pass, 0 errors. Check that every new file is under ~150 lines (`wc -l`).

- [ ] **Step 8: Commit** with the message "Add the attention pattern gallery".

---

### Task 8: Verify and ship the gallery stage

**Files:**
- Modify: `PLAN.md`

- [ ] **Step 1: Check in the browser.** Each item lists the check, then what should happen:
  - **Speed.** The strip should move at 18 px/s, within ±10%, measured as in Task 5.
  - **Recognizable patterns.** Each card's sweep should be legible: causal reads as a triangle, the window as a band, induction as an offset stripe.
  - **Hover.** Hovering a card should make the cursor's height the query row, lift the card, and ease the strip to quarter speed.
  - **Pause.** Pause should stop both the strip and every sweep, and stay stopped through scrolling away and back.
  - **Keyboard focus.** Tab to the Cottention link. The strip should stop while it has focus and resume on Tab away, unless the user paused it (Review Focus 4).
  - **Reduced motion and JS off.** Every card should show its static SVG frame, with nothing moving and the row keyboard-scrollable.
  - **Offscreen.** In a Performance trace, no canvas draws should happen while the gallery is offscreen, and only visible cards should be drawn while it is on screen.
  - **Narrow and wide screens.** No horizontal page scroll at 375px, and no seam at 2560px. At 2560px the gallery adds runtime copies: every copied card must animate rather than stay blank or frozen, and Tab must never reach a link inside a copy (axe should report no `aria-hidden-focus`).
  - **Hover in the clone half.** Hovering a mirrored card should lift it and drive its sweep, just as on a primary card.
  - **HTML weight.** `dist/index.html` should grow by under about 60 KB uncompressed.

- [ ] **Step 2: Measure the JS budget.** Run `npm run build`, then `gzip -c dist/_astro/*.js | wc -c`. Also count the inline scripts in `dist/index.html`. Expected: total under 15,000 bytes. Record the figure in `PLAN.md`'s technical notes.

- [ ] **Step 3: Run Lighthouse** (mobile) on the preview. Expected: Accessibility 100 and CLS < 0.1.

- [ ] **Step 4: Update `PLAN.md`.** Mark the "Ribbon and gallery" stage done with today's date.

- [ ] **Step 5: Commit** with the message "Mark the ribbon and gallery stage complete".

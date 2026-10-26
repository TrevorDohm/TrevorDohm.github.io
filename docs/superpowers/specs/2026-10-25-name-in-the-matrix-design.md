# Name in the matrix: design

*Agreed with Trevor on 2026-10-25 over a live mockup
(`2026-10-22-ribbon-and-gallery-mockups/name-intro.html`). It extends the
ribbon and gallery design on the same branch. Decisions marked **(Trevor)** are
his; **(my call)** were delegated and can be overridden. Everything else follows
`PLAN.md` and `CLAUDE.md`.*

## Why

Trevor wants his name to be part of the matrix rather than text sitting on top
of it, and wants the grid to own the whole first screen. On load the name lights
up in bright cells, holds, then breaks apart into the roaming attention glow
**(Trevor)**. The ribbon below should only appear once you scroll, and should be
smaller so more words show at once **(Trevor)**.

**Anti-goals:** the name unreadable at any moment; the page jumping when the
canvas takes over; a hero that shows nothing without JavaScript; motion that
ignores reduced-motion settings.

## The hero

### Grid

- Fills the whole hero, which is `100svh` tall, so the ribbon starts at the fold
  **(Trevor)**.
- Cells stay square. Their pitch is set by the name's size (below), so the grid
  is coarse on wide screens and fine on phones: about 38px at 1440px wide and
  about 14px at 390px **(Trevor: "more cells, shrink the cells on phones")**.
- The grid is `cols × rows`, no longer a square `n × n`. Columns and rows cover
  the hero edge to edge, aligned so the name's cells land exactly on grid cells.
- Everything the matrix does today keeps working on the larger grid: cursor
  softmax glow, trailing ease, hovered row and column axis, click ripple,
  buttons pulling the glow, idle drift (now wandering the whole hero), pause
  offscreen and in hidden tabs, ~30fps when idle, start after `load`.

### The name

- Drawn in a 3×5 pixel font **(my call; mockup)**, two lines: TREVOR over DOHM.
  M is 5 cells wide; every other letter is 3; one empty column between letters.
  TREVOR is 23 columns wide; the block is 5 + 1 + 5 = 11 rows.
- One empty row between TREVOR and DOHM, and the tagline starts one empty row
  below DOHM, so the spacing reads as one rhythm **(Trevor: the gaps looked
  uneven)**.
- The "Philadelphia, PA" eyebrow is removed from the hero **(Trevor)**. The
  location stays in `src/data/site.ts`.
- Left edge aligned with the text column (`section-container`), clear of the
  fixed nav at the top.

### Sizing: the static name sets the grid

**(my call)** The hero renders a build-time inline SVG of the name in cells,
sized by CSS: its width is a responsive length (about 86% of the text column on
phones, about 52% of the viewport on wide screens, capped so the name, tagline,
role line and buttons fit above the dissolving bottom rows on short screens).
Its height follows from the 23×11 aspect, and its bottom margin is one pitch
(`width / 23`).

At runtime the matrix reads the SVG's box: `pitch = svgWidth / 23`, and the grid
origin is offset so a cell boundary falls on the SVG's top-left corner. The live
cells then sit exactly where the static ones were.

- No layout shift when the canvas takes over (the SVG stays in flow, hidden
  visually once the canvas has drawn).
- Without JS, the SVG is the name: visitors see it in the grid style.
- Reduced motion: the canvas draws the name bright and still; or, if the canvas
  is unavailable, the SVG stays.

### Timeline (from the mockup)

| Phase | Time | What happens |
|---|---|---|
| Form | 0 to 0.9 s | Name cells light up in a left-to-right sweep. Other cells near dark. |
| Hold | 0.9 to 2.5 s | Name fully bright (top of the color ramp, with glow). |
| Break | 2.5 to 3.9 s | Each name cell lets go at its own seeded moment over 1.4 s and fades over 0.5 s. The query point starts on the name's centre and eases out into the idle drift. |
| After | ongoing | Name cells keep a **ghost** weight of 0.30 **(Trevor: brighter than the 0.16 first shown)**. A ghost cell's weight is `max(0.30 + 0.75 × attention, attention)`, so the glow or cursor passing over the name lights it up. |

- The tagline, role line and buttons fade in from about 1.1 s. They are real
  text and must never be invisible to assistive tech; the fade is opacity on
  `.hero-copy` children only and is skipped under reduced motion and without JS.
- Cursor input during the intro takes over the query point as it does today.

### Bottom dissolve

The bottom ~22% of rows fade out in steps, per cell, using a seeded threshold so
the edge looks broken up rather than a straight gradient **(my call; mockup)**.
This replaces the current CSS mask on the canvas.

### Accessibility and performance

- The `<h1>` stays in the DOM with the full name, visually hidden (`sr-only`).
  The SVG and canvas are `aria-hidden`.
- LCP becomes the tagline or the SVG; the canvas still starts after `load`.
- Cell count: about 38×21 = 800 at 1440×800 and about 27×55 = 1,500 on a phone,
  versus 576 today. Glow sprites are drawn only for bright cells, as now. If a
  phone trace shows dropped frames, raise the minimum pitch.
- The text halo (`text-shadow` in the background color) stays on the hero copy.

## The ribbon, smaller **(Trevor)**

- Words `clamp(32px, 5vw, 64px)` (were 48 to 104px).
- Category cells 20px with radius 5px (were 28px / 7px); labels 10px.
- Section padding `3rem` vertical (was 5rem).
- Speeds and all behaviour unchanged.

## Done means

- `npm test` and `npm run build` pass with 0 errors; new pure modules (font and
  name mask, timeline weights, bottom dissolve, rectangular grid layout) have
  tests that can fail.
- The name is legible at every phase in Chrome at 375, 768, 1440 and 2560px
  wide, and never overlaps the nav, tagline or buttons.
- The ribbon's top is at or below the fold on load at those widths.
- Static SVG and first canvas frame line up (no visible jump, layout shift 0).
- JS off: the SVG name shows. Reduced motion: the name is shown still and
  bright, nothing moves.
- Lighthouse mobile: Accessibility 100, CLS < 0.1, Performance ≥ 95.
- Total JS stays under 15 KB gzipped.

## Left to the builder

- Exact CSS lengths for the SVG's responsive width and the height cap.
- Glow colour for the name (the mockup used the top of the existing ramp).
- How the name weights plug into the existing renderer (an extra layer or a
  `base` array added before drawing), provided files stay under ~150 lines.

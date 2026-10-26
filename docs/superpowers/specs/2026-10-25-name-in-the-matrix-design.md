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

## Superseded by build rulings (2026-10-25)

Where this list and the sections above disagree, this list wins.

- **Intro start.** The canvas and the intro clock start when the script runs,
  not at `load`. If the page has already painted (so the visitor has seen the
  static name lit), the intro starts lit, in the hold, instead of sweeping in
  from dark.
- **No copy fade-in.** The tagline, role line and buttons are visible from first
  paint and never start at `opacity: 0`. The tagline is the LCP element.
- **Measured pitches** (the name's width / 23, after the pitch floor below):
  24px at 1366×657, 32px at 1440×790, 32px at 1440×900 and 14px at 390×844
  (18, 27, 32 and 14 before the mockup-parity round), not the ~38px at 1440px
  estimated under Grid.
- **Name size (mockup parity).** The name's width share is the mockup's: 86vw
  below 40rem, 62vw below 68.75rem, 52vw above, never wider than the text
  column. Its height cap reserves only what the copy measures in Chrome: the
  hero's top padding (nav clearance) plus the copy below the name's one-row gap
  (153.11px with a 2-line tagline and 1-line role, 202.36px on phones), so the
  buttons end at or above 78% of the hero. The role line sits 10px below the
  tagline and the buttons 24px below the role line (were 12px and 40px).
- **The drag (mockup parity).** The query trails its target with the mockup's
  plain exponential: each frame it closes 1 - exp(-4·dt) of the gap, with no
  speed cap (6.45% of the gap per 60Hz frame; while following a pointer it
  never moves faster than the pointer). A background cell's weight is
  0.9 · exp(-d / 2.2) with d in cells, unnormalised, as the mockup; name cells
  use exp(-d / 2.2) in `nameWeight`. Cells ease at 12/s. There is no hovered
  row and column highlight.
- **No snap back.** The query's target is the pointer while input is under
  2.5 s old, otherwise the intro or idle path; the query never jumps to either.
  A mouse leaving the hero releases it at once. Hovering or focusing a hero
  button pulls the light onto it and holds it there while the pointer rests on
  the button or focus stays in the hero.
- **Click or tap: a drop.** Replaces the full-page ring. The pressed cell
  flashes (peak 0.7 extra), a soft ring travels out and slows to a stop at 3
  cells, and everything is gone after 0.7 s. No cell 4 or more cells away is
  touched, and overlapping drops are capped at 0.7.
- **Copy mask.** On each layout, the mask is built from the ink of the copy:
  one box per text line of the tagline and role line (Range client rects,
  fragments on one line merged) and one per button. Cells overlapping a box are
  drawn at resting weight (0) with no glow sprite; the cells around them (one
  cell, diagonals included) are capped at 0.5 with no sprite, so the glow fades
  out at the text instead of stopping at a hard-edged hole. With the light
  parked on the cells beside the text (above the tagline, between the role line
  and the buttons, right of the role line) at 1440×900 and 390×844, the
  brightest background pixel behind either line gives at least 5.93:1 against
  the muted text. Name cells are exempt. The idle path stays above the
  dissolve band.
- **Pitch floor.** The name is never narrower than 253px, an 11px pitch, so a
  short viewport cannot multiply the cell count (844×390 had an 8px pitch and
  about 7,000 cells before the floor). A 320px phone's text column is 272px, so
  the floor still fits it.

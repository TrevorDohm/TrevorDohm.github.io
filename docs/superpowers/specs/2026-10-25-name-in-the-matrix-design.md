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

## Superseded by build rulings (2026-10-25, updated 2026-10-26)

Where this list and the sections above disagree, this list wins. The
2026-10-26 round (the owner's layout feedback) replaced the intro start, the
copy fade, the name size and the dissolve band; the replaced rulings are noted
in place.

- **Intro start (2026-10-26).** The canvas and the intro clock start when the
  script runs, not at `load`, and the intro starts dark: the name sweeps
  in (form), holds, then breaks into the ghost, as the mockup. (This replaces
  the 2026-10-25 ruling that started lit, in the hold, once the page had
  painted.) The lit static name never shows first: a tiny inline script just
  before the hero sets `data-js-intro` on `<html>` when motion is allowed, and
  CSS hides the static name under it until the canvas draws. If the matrix
  never takes over, a CSS animation shows the static name after 3 s; a module
  that runs after that starts lit, in the hold (`introStart(shown)` reads the
  static name's opacity), so the name never goes lit, dark, lit. Measured with
  the module held until 4 s: the static name shows at 3.06 s and the canvas
  takes over at 4.03 s with the name at full brightness. Without
  JavaScript, or with reduced motion, the static name shows at once (reduced
  motion: lit and still, and the canvas takes over in place).
- **Copy fade-in (2026-10-26).** The role line and buttons start at opacity 0
  under `data-js-intro` and fade in over 0.8 s from FORM + 0.2 s = 1.1 s on the
  intro clock (the matrix sets `data-copy-shown`), opacity only, as the
  mockup. The same 3 s CSS safety net shows them if the matrix never runs. A
  focused button shows at once (`:focus-within`). Never hidden without
  JavaScript or under reduced motion. (This replaces "no copy fade-in".) The
  role line is now the LCP element and LCP lands as its fade ends: 2.0 s
  observed, 2.1 s in Lighthouse's simulated mobile run (Performance 98, CLS 0),
  up from 1.5 s with the tagline.
- **Tagline removed (2026-10-26).** The hero copy is the role line and the
  buttons. The role line reads `MBA Candidate @ Wharton | AI Engineer @ RTX |
  Philadelphia, PA`: `site.role` plus `site.location`, composed in `Hero`, and
  it wraps only at the separators. `site.tagline` stays in `src/data/site.ts`
  but is not shown.
- **Centred block (2026-10-26).** The block (name, one-row gap, role line,
  buttons) is centred at 45% of the hero below the nav: top padding for nav
  clearance and a bottom padding of a tenth of the rest. Measured centre:
  0.451 to 0.454 of the area below the nav at every size checked, down to
  320×480.
- **Name size (2026-10-26).** Width shares are unchanged (86vw below 40rem,
  62vw below 68.75rem, 52vw above, never wider than the text column) and the
  11px floor stays. The height cap now keeps the name's bottom at or above the
  dissolve band's top (65% of the hero): with the block centred at 45%, that
  is 23p ≤ 4.6 (0.2H − 0.55N + 0.5C) (the line stays at 0.65 after the band
  grew to 45%; see Bottom fade), where C is the copy below the gap,
  measured in Chrome at 87.2px (1-line role) and 107.2px on phones (2 lines).
  Name cells are also exempt from the dissolve, so a forced floor on a short
  screen can't erode the name.
- **Measured pitches (2026-10-26):** 27px at 1366×657, 32px at 1440×790, 32px
  at 1440×900, 41px at 2560×1440, 14px at 390×844 and 14px at 375×667 (24, 32,
  32, 41, 14 and 14 before; the name grows only where height was the limit).
  Earlier: 18, 27, 32 and 14 before the mockup-parity round, not the ~38px at
  1440px estimated under Grid.
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
  button pulls the light onto it with the same glide; like any resting pointer
  it lets go after 2.5 s, as the mockup. Focus leaving the hero releases it at
  once. The idle path is the mockup's drift: x = W(0.5 + 0.34 sin(0.31t)
  cos(0.13t)), t seconds since the break, with y scaled to fit above the 45%
  band (2026-10-26): y = H(0.31 + 0.17 sin(0.23t + 1)), within 0.14H to 0.48H
  (the mockup's 0.45 + 0.3 reached 0.75H).
- **Click or tap: a drop.** Replaces the full-page ring. The pressed cell
  flashes (peak 0.7 extra), a soft ring travels out and slows to a stop at 3
  cells, and everything is gone after 0.7 s. No cell 4 or more cells away is
  touched, and overlapping drops are capped at 0.7.
- **Copy mask.** On each layout, the mask is built from the ink of the copy:
  one box per text line of the role line (Range client rects, fragments merged
  only when they overlap by more than half the shorter one) and one per
  button. Cells overlapping a box keep 0.2 of their weight and the cells
  around them (one cell, diagonals included) keep 0.6; neither gets a glow
  sprite. Dimming by a factor keeps the glow's shape across the copy. 0.2 was
  chosen as the largest factor that kept the copy at 4.5:1 (0.25 gave 4.27:1
  with the tagline). Re-measured 2026-10-26 after the gradual band, with the
  light parked on the role line, above it, between it and the buttons, right
  of it, right of the buttons and below the buttons, at 1440×900, 1366×657 and
  390×844: the brightest background pixel behind the role line gives at least
  5.19:1 against the muted text. Name cells are exempt. The idle path stays
  above the dissolve band.
- **Pitch floor.** The name is never narrower than 253px, an 11px pitch, so a
  short viewport cannot multiply the cell count (844×390 had an 8px pitch and
  about 7,000 cells before the floor). A 320px phone's text column is 272px, so
  the floor still fits it.
- **Bottom fade (2026-10-26, revised twice after Trevor's review).** The band
  is the lowest 45% of rows (22% before this round). A scattered-dropout
  version left big black gaps, and a version that only darkened to 0.18 left a
  visible cutoff where the hero ends; Trevor wanted neither. It now fades
  continuously to about 0: each cell's visibility goes from 1 at the band top
  to about 0 on the last row along half a straight line and half a smoothstep
  (bright longer at the top, settling gently at the bottom), times a seeded
  ±10% jitter that shrinks to nothing toward the bottom. A few isolated cells
  drop out fully, only in the band's middle: cells on a sparse lattice
  ((col + 2 row) mod 5 = 0, no two touching), with a chance peaking at 30% at
  the band's middle and 0 in its top third and bottom fifth, about 1% of band
  cells. Measured from the canvas at 1440×900, 1366×657 and 390×844: last-row
  means 0.021, 0.029 and 0.007; dropouts 0.9% to 1.3%; no dark cell touches
  another dark cell more than once. Desktop bands are 12 to 14 rows, so a
  row-to-row step reaches 0.12 there; the 390×844 band (28 rows) steps at most
  0.07. With the hero's bottom scrolled to mid-screen there is no visible line
  where it meets the ribbon. The band's top (0.55 of the hero) now sits above
  the name's lower rows on desktop; name cells are exempt and the band is
  still above 0.9 there. The role line and buttons sit in the band's upper
  half (about 0.6 to 0.8 visibility); their solid backgrounds and the copy
  dimming keep them legible.

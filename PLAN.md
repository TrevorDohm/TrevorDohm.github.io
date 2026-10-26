# Website Plan

**Repo:** `TrevorDohm/TrevorDohm.github.io` · **Live:** [trevordohm.github.io](https://trevordohm.github.io)

| Phase | Status |
|---|---|
| Astro rebuild | Shipped 2026-09-17 (`9a4b0e8`) |
| Design overhaul | **In progress.** Phases 1 (dark foundation) and 2 (attention matrix) are merged to `master` and live |
| Ribbon and gallery | **Done** 2026-10-25 on branch `ribbon-gallery`. Ribbon and gallery both verified in Chrome only; Safari, Firefox and VoiceOver are unchecked. Not yet merged to `master` |
| Name in the matrix | **Done** 2026-10-25 on branch `ribbon-gallery`. The hero's centerpiece is now the name, spelled in matrix cells. Verified in Chrome only; Safari, Firefox, VoiceOver and real touch are unchecked. Not yet merged to `master`. See the [design spec](docs/superpowers/specs/2026-10-25-name-in-the-matrix-design.md) |

---

## Shipped: Astro rebuild

The old Vite + React SPA was never finished. Its Projects and Blog pages weren't
routed, the nav never rendered, and the real portfolio content sat in a store that
nothing imported. It's been replaced with Astro 7 + Tailwind 4, deployed by GitHub
Actions on push to `master`. Content is current as of the Sep 2026 resumes and
lives in `src/data/`.

The full rebuild plan, with the audit findings and resume reconciliation, is in git
history at commit `9a4b0e8`.

---

## Now: Design overhaul

*Drafted 2026-09-18. Revised the same day after an independent review by a second
agent, whose main claims were checked against the installed Astro source. Changes
from that review are marked **(review)**.*

### Goal

Make the site memorable and fun to interact with, built around an interactive
attention matrix in the hero. The current site is readable and fast but looks like
a template. After this, a visitor should remember the site, and the content should
be just as easy to read as it is now.

### Decisions so far

| Decision | Choice | Why |
|---|---|---|
| Theme | Dark base with bright accents | The matrix glow depends on a dark background |
| Hero centerpiece | The name in the matrix: `TREVOR` and `DOHM` spelled in cells of the interactive attention matrix, which forms, holds, then breaks into a ghost the cursor glow brightens (changed 2026-10-25) | Trevor's pick. Purely visual, with no explainer about the research. The name was the hero's real focal point, so it now lives in the grid instead of beside it |
| Hero grid | Full-screen, sized by the name: the pitch is the name's width over 23 columns, and the grid fills the whole `100svh` hero (2026-10-25) | The name lands exactly on grid cells, and the hero reads as one surface |
| Hero eyebrow | Removed ("Philadelphia, PA") (2026-10-25) | The name block takes its place at the top of the copy |
| Hero bottom edge | A bottom fade anchored under the buttons: from the row holding their bottom edge the cells dim to 0 on the last row, and from the next row down about 22% of cells are removed, rising to about 68% at the bottom, chosen at random but never as a fully removed 2x2 block; replaces the old CSS mask (2026-10-25, settled 2026-10-26) | The grid tapers into the ribbon and its cutoff can't be located. Rejected: random dropouts over a 35% band (black gaps), darkening that stopped at 0.18 (a visible edge), a 45% fade with almost no removals (too even), an ordered dither (patterns), and a fade from 0.55H (empty cells too high) |
| Hero layout and intro | The block (name, role line, buttons) is centred at 45% of the hero below the nav; the tagline is removed and the role line reads `MBA Candidate @ Wharton \| AI Engineer @ RTX \| Philadelphia, PA`; the intro starts dark (lit in the hold only if a late module finds the static name already shown) and the copy fades in at about 1.1 s (2026-10-26) | Trevor's feedback: the name sat too close to the top, and he preferred the mockup's dark start and late copy. An inline gate (`data-js-intro`) hides the static name and copy only when JS runs and motion is allowed, with a 3 s CSS safety net |
| Matrix tech | Canvas 2D in plain TypeScript | About 5 KB, 60fps, works on phones. WebGL/Three.js would add 150 KB+ and drain phone batteries faster |
| Framework JS | None | Every animation is plain TS in Astro `<script>` tags. No React, GSAP, or Framer Motion |
| Page transitions | Browser-native cross-document view transitions, not Astro's `<ClientRouter />` **(review)** | Zero JS instead of ~8.6 KB gzipped (measured), and it avoids the two lifecycle bugs described under Technical notes |
| Word ribbon and attention gallery | Two drifting rows of interest words under the hero, and a gallery of attention-map cards. Page order: Hero, stats strip, Ribbon, Selected Work, Gallery, Contact. See the [design spec](docs/superpowers/specs/2026-10-22-ribbon-and-gallery-design.md) | The stats strip keeps the matrix and the ribbon, both glowing and moving, from sitting next to each other. Until phase 3 adds it, the ribbon sits directly under the hero |

**Name in the matrix, verified 2026-10-25 in Chrome only** (headless Chrome on
`npm run preview`): at 375x812, 375x667, 768x1024, 1366x768, 1440x900 and 2560x1440 the
name is lit at the hold (contrast against the cells around it about 12:1 or
more). After the break the ghost is deliberately quiet, about 1.6 to 2.2:1 at
weight 0.30 (Trevor's choice), and brightens under the glow. The name never overlaps the nav, role line or
buttons, and the ribbon's top sits exactly at the fold. On a fast load the canvas
draws before first paint and sweeps the name in. Since 2026-10-26 the static
name stays hidden until the canvas draws, so on Slow 4G with 4x CPU the dark
backdrop paints first (1.67 s), then the canvas sweeps the name in from dark
(2.36 s), with no lit frame first and layout shift 0. If the module arrives
after the 3 s safety net has shown the static name, the canvas takes over lit
(measured with the module held until 4 s). The copy fades in at about 1.1 s,
so the LCP element is the role line: Lighthouse mobile Performance 97 to 98,
Accessibility 100, CLS 0, LCP 2.1 s (1.5 s before the copy fade). Moto G Power profile at 4x CPU: 60fps while
dragging. While idle the loop is capped at about 30fps; at 60 Hz it draws about
22 times a second, because a gap of just under 33 ms waits one more frame. Safari, Firefox, VoiceOver and real
touch are unchecked.

### Look

**Palette.** All colors are tokens in `global.css`, replacing the light palette.
Contrast was computed with the WCAG formula.

| Token | Value | Use | Contrast on `background` |
|---|---|---|---|
| `background` | `#07070B` | Page | |
| `surface` | `#0F0F16` | Cards | |
| `line` | `#1E1E2A` | Borders, grid lines. **Never text** | 1.22:1 |
| `foreground` | `#EDEDF3` | Body text | |
| `muted` | `#9494A8` | Secondary text | 6.76:1 (6.42:1 on `surface`) |
| `accent` | `#7C9CFF` | Links, focus rings, glow core | 7.71:1 |
| `accent-2` | `#B18CFF` | Second glow color, for gradients | 7.72:1 |
| `bake` | `#E28D23` | bake category color | 7.73:1 |
| `hike` | `#2AB580` | hike category color | 7.68:1 |

**Type.** Geist Sans for headings and body, Geist Mono for labels such as dates,
tags, section numbers, and stats. Self-hosted through Astro 7's top-level `fonts`
config option, which preloads the files and generates size-matched fallbacks. This
replaces the current render-blocking `@import` from Google Fonts in `global.css`.
**(review)**

**Texture.** A faint film-grain overlay across the page, plus thin grid lines
behind the hero. Both are static CSS or SVG, no JS.

### The attention matrix (hero)

*Updated 2026-10-25 for the name in the matrix; see that row in Decisions so far
and the [design spec](docs/superpowers/specs/2026-10-25-name-in-the-matrix-design.md).*

A grid of rounded cells drawn on a full-screen `<canvas>` behind the hero copy. The
name is spelled in the grid's own cells (3x5 pixel letters, `TREVOR` over `DOHM`, a
23 by 11 cell block). A static SVG of the same cells shows without JS and under
reduced motion (with JS and motion it stays hidden until the canvas draws, so
the intro starts dark); the canvas reads the SVG's box to size its grid and
takes over in place. The
`<h1>` keeps the full name, visually hidden, so screen readers say it once.
The hero is `100svh` tall, which doesn't change when the mobile address bar shows
or hides, so the canvas re-lays out on every real resize. *(An earlier revision
ignored small height-only resizes; the phase 2 final review found that stretched
the canvas on desktop and guarded nothing on phones, so it was removed.)*

- **Size.** Rectangular and full-screen. The pitch comes from the name's width
  (14px on a 375px phone, 27px at 1366×657, 32px at 1440, 41px at 2560); the rows and columns are
  whatever fills the hero.
- **Cursor as query.** Each cell's weight is a softmax over its negative distance
  to the cursor. Weight sets brightness and shifts color from dim `line` through
  `accent` to `accent-2`.
- **Glow.** High-weight cells draw a pre-rendered radial-gradient sprite with
  `globalCompositeOperation = 'lighter'`. Not `ctx.shadowBlur`, which is too slow
  per cell on phones. **(review)**
- **Trailing glow.** Weights ease toward their target each frame, so light trails
  behind the cursor instead of snapping to it.
- **Axis highlight.** The hovered cell's row and column light faintly, like the axes
  of a matrix.
- **Click ripple.** Clicking sends a pulse outward through the grid.
- **Buttons pull the glow.** Hovering or focusing a hero button moves the query
  point onto it. **(review)**
- **Idle drift.** After 2 seconds without input, a query point wanders a smooth
  looping path so the hero never sits still. When the pointer leaves or goes
  idle, the light glides back to that path at about the path's own pace (1.1
  times its top speed), carrying its own speed into the turn and easing onto
  the path, instead of snapping. The intro's break keeps its original motion
  unless the pointer has steered the light; a release during the intro glides
  it too (2026-10-26). Idle drift is capped at about 30fps to
  save battery. **(review)** At 60 Hz that measures about 22 draws a second,
  because a gap of just under 33 ms waits one more frame.
- **Touch.** Tapping sends a ripple and moves the glow to the tap point.
  Horizontal drags also move it. Vertical drags scroll the page as normal: with
  `touch-action: pan-y` the browser takes vertical drags for scrolling, so the
  plan no longer promises drag-anywhere on phones. **(review)**
- **Input target.** Pointer listeners go on the hero `<section>`, not the canvas,
  because the name and buttons sit on top of the canvas. **(review)**
- **Intro.** The name forms (0.9 s), holds lit (1.6 s), then breaks (1.4 s)
  into a ghost at weight 0.30 that the glow brightens. The clock starts when the
  script runs and starts dark (2026-10-26), or lit in the hold if the 3 s
  safety net already showed the static name. The role line and buttons fade in
  from about 1.1 s.
- **Bottom fade.** From just under the buttons the cells dim to 0 at the
  bottom, and more drop out the lower they are (at random, never in clumps),
  so the glow dims there too and the hero has no visible bottom edge. Name
  cells never fade.

**Performance rules.** Runs on `requestAnimationFrame`. It used to start after the
`load` event **(review)**; since the name in the matrix it starts when the script
runs, because the static name is hidden as soon as the canvas draws. Pauses when the hero
scrolls offscreen or the tab is hidden. Device pixel ratio capped at 2. Cell
positions are computed once per resize, not every frame. Target: 60fps on a
2020-era laptop, under 8 KB gzipped.

**Fallbacks.** With `prefers-reduced-motion`, it draws one static frame with the
name lit, with no idle drift and no ripple. Without JS, a static CSS gradient and the
SVG name show instead, and the role line and buttons render normally. The canvas is `aria-hidden` because it is
decorative.

### Motion across the site

1. **Entrance (phase 3). Superseded 2026-10-25 by the name in the matrix:** the
   name intro (form, hold, break) is the entrance now; the `<h1>` is `sr-only`
   and the LCP element was the tagline; since 2026-10-26 it is the role line,
   which fades in at about 1.1 s. The original plan, kept for reference:
   A staged ~1.2 s arrival, modeled on how raycast.com
   brightens its headline instead of fading it in. Nothing is ever invisible.
   - **0 ms:** all hero text is painted in `muted`, slightly blurred and offset;
     the grid sits near black.
   - **150 ms:** a light sweeps diagonally across the grid, waking cells as it
     passes. This is the existing intro wave, brighter and faster.
   - **400 ms:** the query point flies in from off-canvas and settles, trailing
     the comet smear.
   - **550 ms onward:** each hero line brightens from `muted` to `foreground` and
     sharpens from blur, staggered, while the nav settles in.
   The `<h1>` is the LCP element: it is painted from the first frame, and only
   its color and blur animate, never its opacity. With reduced motion the
   finished state renders immediately. The `<h1>` carries `aria-label` with the
   full name and any per-letter spans are `aria-hidden`, so screen readers say
   the name once. **(review)**
2. **Matrix fades on scroll (phase 3). Superseded 2026-10-25 by the name in the
   matrix:** the bottom dissolve (lowest 22% of rows) now erodes the grid's lower
   edge in place of a mask. The original plan, kept for reference: Cells dissolve bottom-row-up as the hero
   scrolls away, an `outroAlpha` mirror of the intro wave, so the grid erodes
   instead of being clipped by the hero's edge. Browsers without scroll-driven
   animations, and anyone with reduced motion, get a plain opacity and blur fade
   on the whole layer instead. The nav melts from transparent to glass on the
   same timeline, so the two read as one movement.
3. **Scroll reveals.** Elements marked `data-reveal` fade and rise as they enter the
   viewport, with children staggered. One small IntersectionObserver script. The
   hiding CSS only applies once the script sets `data-js` on `<body>`, so if the
   script fails, content stays visible. **(review:** originally a class on `<html>`)
4. **Spotlight cards.** On project cards, a radial glow follows the cursor across
   the border and surface, driven by CSS variables set on `pointermove`. Cards lift
   slightly on hover.
5. **Stats strip.** A row under the hero, in mono type, with numbers that count up
   when scrolled into view: ~10x throughput, ~6,600 dataset downloads, 100+ agent
   tools, Best Paper. Every figure is already on the site or the resumes. The final
   values are in the HTML, digits use `tabular-nums`, and each number has a reserved
   width, so counting never shifts the layout. **(review)**
6. **Experience timeline.** The vertical line draws itself as you scroll, and each
   role's dot lights when the line reaches it. Uses CSS scroll-driven animations
   inside `@supports (animation-timeline: view())` and
   `@media (prefers-reduced-motion: no-preference)`, with a static line otherwise.
   `animation-timeline` is declared after the `animation` shorthand, because the
   shorthand resets it. **(review)** Supported in Chromium 115+ and Safari 26;
   check Firefox's current status on caniuse before relying on it.
7. **Nav.** On the home page, transparent over the hero, turning to blurred glass
   once you scroll past it. On every other page, glass from the start, since there
   is no hero behind it. **(review)** The active page gets a highlighted pill.
8. **Page transitions.** `@view-transition { navigation: auto; }` in CSS cross-fades
   between pages, and `view-transition-name` on the site name carries it across as
   a shared element. Works in Chromium and Safari 18.2+. Other browsers load the
   page normally. **(review)** Tradeoff: the active-link pill can't slide from one
   page's nav to the next.
9. **Small touches.** Link arrows nudge on hover, tag chips glow, and the primary
   button gets a gradient border that sweeps on hover.

### Also in scope **(review)**

- **Custom 404 page** (`src/pages/404.astro`) in the matrix style. GitHub Pages
  serves `404.html` automatically. About 1 hour.
- **Link-preview image.** A 1200×630 matrix-style OG image, with `twitter:card` set
  to `summary_large_image`. Most people first see the site as a LinkedIn preview,
  which currently shows the headshot. About 1 hour.
- **Smaller photo.** `pfp.jpg` is 171 KB at 1160×1550 and displays at 128px. Serve
  it through `astro:assets` at the displayed size. About 10 minutes.

### Code structure

Requested by Trevor on 2026-09-18: the overhaul should leave the code modular, not
just the site prettier. The rules:

1. **One job per file.** A page composes sections, a section composes UI pieces, and
   a UI piece renders one thing. Target under ~150 lines per file.
2. **Pages don't hold markup.** `index.astro` becomes a list of section components.
3. **Data flows down through props.** Only pages and layouts import from
   `src/data/`. Components receive what they render as props, so each can be
   reused or moved.
4. **Logic separate from the DOM.** Math and formatting live in pure TypeScript
   modules with no `document` or `window` access. DOM wiring lives in thin modules
   that call them.
5. **One interface for behaviors.** Every client-side behavior exports
   `init(root: HTMLElement): () => void`, which sets up on one root element and
   returns a cleanup function. No behavior reaches outside its root.
6. **Styles split by purpose.** Design tokens, base element styles, utilities, and
   motion each get their own CSS file, imported in order from `global.css`.
7. **Pure modules are tested.** Vitest unit tests for the pure logic: attention
   weights, grid geometry, easing, count-up formatting. `npm test` runs in CI before
   the build, so a failing test blocks the deploy.

Target layout:

```
src/
  components/
    layout/     Nav.astro, Footer.astro
    ui/         Button.astro, Tag.astro, SectionHeading.astro, SpotlightCard.astro,
                MarqueeRow.astro, PatternCard.astro
    home/       Hero.astro, Stats.astro, SelectedWork.astro, Contact.astro,
                Ribbon.astro, RibbonItem.astro, Gallery.astro
    projects/   ProjectCard.astro
    experience/ TimelineItem.astro
    matrix/     AttentionMatrix.astro
  lib/
    matrix/     geometry.ts   grid layout from canvas size (pure)
                attention.ts  cursor to cell weights, softmax, easing (pure)
                renderer.ts   draws a frame, owns the glow sprite
                input.ts      pointer, tap, and button-attraction events
                loop.ts       rAF loop, visibility pause, idle drift
                index.ts      init(root), wires the above together
    marquee/    drifting rows: sizing, copies, hover, Pause, keyboard focus hold
    patterns/   attention pattern maps for the gallery cards, and their canvas loop
    motion/     reveal.ts, countup.ts, spotlight.ts
                prefers-reduced-motion.ts  shared check used by all of them
                while-motion-allowed.ts    starts and stops a behavior as the setting changes
  styles/       tokens.css, base.css, utilities.css, motion.css, global.css
  data/         site.ts, projects.ts, experience.ts, interests.ts, patterns.ts
  pages/        index, projects, experience, 404
```

Tests sit next to the modules they cover, for example `attention.test.ts` beside
`attention.ts`.

### Deliberately not doing

Custom cursor, sound, 3D card tilt, scroll-jacking or smooth-scroll libraries, a
loading screen, and animation libraries. Each adds weight or gets in the way of
reading, and none is needed to reach the goal.

### Technical notes

- **JS budget.** The total target is under 15 KB gzipped, all first-party.
  Without `<ClientRouter />` this has plenty of room. Method (2026-10-25): gzip
  each `dist/_astro/*.js` file on its own at level 9 (Node `zlib.gzipSync`, no
  file name in the header), sum the sizes, and add the inline `<script>` in
  `dist/index.html` gzipped the same way. Each file is its own response, so
  per-file gzip is what the browser transfers. (An earlier note here described
  `gzip -c dist/_astro/*.js | wc -c` as concatenating the files and gzipping
  once; it actually gzips each file and concatenates the gzip members, each with
  its own header holding the file name, so it overstated the total slightly.)
  By this method: 7,425 bytes of bundles plus the 253-byte inline nav script,
  7,678 bytes in all, at `81dee26` (after the ribbon and gallery, before the
  name in the matrix); 8,889 + 253 = 9,142 bytes after the name in the matrix
  and its review fixes. Five bundles in both: hero matrix, marquee, gallery, a
  shared chunk (palette, loop and maths helpers) and the reduced-motion helper.
- **New files.** See Code structure for the full layout. Beyond it:
  `public/og.png` and a Vitest config.
- **Why not `<ClientRouter />`.** **(review)** It would add ~8.6 KB gzipped and two
  bugs:
  - Astro's bundled scripts run only once per session, not on each navigation. The
    nav script in `Nav.astro` holds a reference to the first page's `#mobile-menu`,
    which is replaced on the first page swap, so the menu handlers would act on an
    element that no longer exists. *(The first draft of this plan said the listeners
    would pile up. That was wrong.)*
  - On each swap the router removes every attribute from `<html>` and copies the
    new page's attributes (`swapRootAttributes` in
    `astro/dist/transitions/swap-functions.js`), so any class set by script is lost.
  With native view transitions each navigation is a real page load, so neither
  problem exists and no script needs teardown logic.
- **Photo.** It moves from the hero to the contact section, so the matrix is the
  hero's one focal point.
- **Accessibility.** Visible focus rings in `accent`, AA contrast on every text
  color, and reduced motion honored by every animation, not just the matrix.

### Phases

Each phase leaves the site shippable.

1. **Dark foundation.** Move to the Code structure layout and add Vitest. New
   tokens, self-hosted fonts, grain. Restyle nav, footer, cards, and pages.
   Glass nav on every page. Optimized photo.
2. **Attention matrix.** Build the canvas hero with its fallbacks.
3. **Motion system.** The entrance; the matrix fading on scroll; scroll reveals;
   spotlight cards driven by the hero's own falloff math; stats strip; timeline;
   nav states (transparent over the home hero, glass after scrolling past it);
   an ambient texture threading across section boundaries; matrix polish (comet
   trail on fast cursor movement, several idle wanderers instead of one).
4. **Transitions, 404, and craft.** Native view transitions, shared site name,
   the 404 page whose cells resolve out of noise into "404", matrix-style OG
   image and favicon, gradient-sweep borders that catch light, a wider type
   scale, consistent focus and external-link treatments, tags that brighten
   their matches on hover.
5. **Content presentation (added 2026-09-22).** Abstract generated SVG diagrams
   for the internal RTX projects, which can have no screenshots; a `/research`
   page for Cottention with a figure, citation header, and copyable BibTeX; one
   metric chip per project; and collapsible details so non-featured projects
   stop hiding their bullets entirely (a real content bug today: `ProjectCard`
   renders `points` only when `featured` is set).
6. **Verify and ship.** See the checklist below. Also update each GitHub Action in
   `deploy.yml` to its own latest major version, checked one by one, since
   `upload-pages-artifact` and `deploy-pages` are versioned separately from
   `checkout` and `setup-node`. **(review)**

### Done means

- [ ] Lighthouse on mobile: Performance ≥ 95, Accessibility 100, CLS < 0.1
- [ ] Hero intro doesn't delay LCP: LCP under 2.5s in Lighthouse's throttled run
- [ ] Matrix holds 60fps in a DevTools performance trace, and pauses offscreen
- [ ] Reduced motion: no movement anywhere, and all content visible
- [ ] JS disabled: all content visible and readable
- [ ] Works at 375px width: tap ripple works, vertical scrolling over the hero works
- [ ] Screen reader reads the hero name once, not letter by letter
- [ ] `/does-not-exist` shows the custom 404 page on the live site
- [ ] A LinkedIn post inspector preview shows the OG image
- [ ] Total JS under 15 KB gzipped
- [ ] `npm test` passes in CI, and every pure module has tests
- [ ] No file over ~150 lines without a stated reason

### Open choices

These have defaults and don't block starting. Change any of them before or during
the work.

1. **Accent color.** Default is periwinkle blue into violet. A cyan-into-green
   "terminal" look or warm orange into pink would also suit the matrix.
2. **Light mode.** Default is dark only. Supporting both themes would roughly
   double the color and contrast work.
3. **Photo placement.** Default moves it to the contact section. It could stay in
   the hero as a small avatar with a glowing ring instead.

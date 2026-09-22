# Website Plan

**Repo:** `TrevorDohm/TrevorDohm.github.io` · **Live:** [trevordohm.github.io](https://trevordohm.github.io)

| Phase | Status |
|---|---|
| Astro rebuild | Shipped 2026-09-17 (`9a4b0e8`) |
| Design overhaul | **In progress.** Phases 1 (dark foundation) and 2 (attention matrix) done on branch `design-overhaul` |

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
| Hero centerpiece | Interactive attention matrix that glows around the cursor | Trevor's pick. Purely visual, with no explainer about the research |
| Matrix tech | Canvas 2D in plain TypeScript | About 5 KB, 60fps, works on phones. WebGL/Three.js would add 150 KB+ and drain phone batteries faster |
| Framework JS | None | Every animation is plain TS in Astro `<script>` tags. No React, GSAP, or Framer Motion |
| Page transitions | Browser-native cross-document view transitions, not Astro's `<ClientRouter />` **(review)** | Zero JS instead of ~8.6 KB gzipped (measured), and it avoids the two lifecycle bugs described under Technical notes |

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

**Type.** Geist Sans for headings and body, Geist Mono for labels such as dates,
tags, section numbers, and stats. Self-hosted through Astro 7's top-level `fonts`
config option, which preloads the files and generates size-matched fallbacks. This
replaces the current render-blocking `@import` from Google Fonts in `global.css`.
**(review)**

**Texture.** A faint film-grain overlay across the page, plus thin grid lines
behind the hero. Both are static CSS or SVG, no JS.

### The attention matrix (hero)

A grid of rounded cells drawn on a full-width `<canvas>` behind the name and tagline.
The hero is `100svh` tall, which doesn't change when the mobile address bar shows
or hides, so the canvas re-lays out on every real resize. *(An earlier revision
ignored small height-only resizes; the phase 2 final review found that stretched
the canvas on desktop and guarded nothing on phones, so it was removed.)*

- **Size.** About 24×24 cells on desktop, 14×14 on phones.
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
  looping path so the hero never sits still. Idle drift runs at about 30fps to
  save battery. **(review)**
- **Touch.** Tapping sends a ripple and moves the glow to the tap point.
  Horizontal drags also move it. Vertical drags scroll the page as normal: with
  `touch-action: pan-y` the browser takes vertical drags for scrolling, so the
  plan no longer promises drag-anywhere on phones. **(review)**
- **Input target.** Pointer listeners go on the hero `<section>`, not the canvas,
  because the name and buttons sit on top of the canvas. **(review)**
- **Intro.** On load, cells fade in as a diagonal wave.

**Performance rules.** Runs on `requestAnimationFrame`, starting after the `load`
event so it doesn't compete with first paint. **(review)** Pauses when the hero
scrolls offscreen or the tab is hidden. Device pixel ratio capped at 2. Cell
positions are computed once per resize, not every frame. Target: 60fps on a
2020-era laptop, under 8 KB gzipped.

**Fallbacks.** With `prefers-reduced-motion`, it draws one static frame, with no idle
drift and no ripple. Without JS, a static CSS gradient shows instead, and the name and
tagline render normally either way. The canvas is `aria-hidden` because it is
decorative.

### Motion across the site

1. **Hero intro.** Name letters rise and un-blur in a stagger, then the tagline and
   buttons follow. The `<h1>` is the page's LCP element, so letters start from a
   small offset and blur, never from `opacity: 0`, and the whole reveal finishes in
   about 500 ms. The `<h1>` carries `aria-label` with the full name and the letter
   spans are `aria-hidden`, so screen readers say the name once. **(review)**
2. **Scroll reveals.** Elements marked `data-reveal` fade and rise as they enter the
   viewport, with children staggered. One small IntersectionObserver script. The
   hiding CSS only applies once the script sets `data-js` on `<body>`, so if the
   script fails, content stays visible. **(review:** originally a class on `<html>`)
3. **Spotlight cards.** On project cards, a radial glow follows the cursor across
   the border and surface, driven by CSS variables set on `pointermove`. Cards lift
   slightly on hover.
4. **Stats strip.** A row under the hero, in mono type, with numbers that count up
   when scrolled into view: ~10x throughput, ~6,600 dataset downloads, 100+ agent
   tools, Best Paper. Every figure is already on the site or the resumes. The final
   values are in the HTML, digits use `tabular-nums`, and each number has a reserved
   width, so counting never shifts the layout. **(review)**
5. **Experience timeline.** The vertical line draws itself as you scroll, and each
   role's dot lights when the line reaches it. Uses CSS scroll-driven animations
   inside `@supports (animation-timeline: view())` and
   `@media (prefers-reduced-motion: no-preference)`, with a static line otherwise.
   `animation-timeline` is declared after the `animation` shorthand, because the
   shorthand resets it. **(review)** Supported in Chromium 115+ and Safari 26;
   check Firefox's current status on caniuse before relying on it.
6. **Nav.** On the home page, transparent over the hero, turning to blurred glass
   once you scroll past it. On every other page, glass from the start, since there
   is no hero behind it. **(review)** The active page gets a highlighted pill.
7. **Page transitions.** `@view-transition { navigation: auto; }` in CSS cross-fades
   between pages, and `view-transition-name` on the site name carries it across as
   a shared element. Works in Chromium and Safari 18.2+. Other browsers load the
   page normally. **(review)** Tradeoff: the active-link pill can't slide from one
   page's nav to the next.
8. **Small touches.** Link arrows nudge on hover, tag chips glow, and the primary
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
    ui/         Button.astro, Tag.astro, SectionHeading.astro, SpotlightCard.astro
    home/       Hero.astro, Stats.astro, SelectedWork.astro, Contact.astro
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
    motion/     reveal.ts, countup.ts, spotlight.ts
                prefers-reduced-motion.ts  shared check used by all of them
  styles/       tokens.css, base.css, utilities.css, motion.css, global.css
  data/         site.ts, projects.ts, experience.ts (unchanged)
  pages/        index, projects, experience, 404
```

Tests sit next to the modules they cover, for example `attention.test.ts` beside
`attention.ts`.

### Deliberately not doing

Custom cursor, sound, 3D card tilt, scroll-jacking or smooth-scroll libraries, a
loading screen, and animation libraries. Each adds weight or gets in the way of
reading, and none is needed to reach the goal.

### Technical notes

- **JS budget.** The site ships 0 KB of JS today. After the overhaul the total
  target is under 15 KB gzipped, all first-party. Without `<ClientRouter />` this
  has plenty of room.
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
3. **Motion system.** Scroll reveals, spotlight cards, stats strip, timeline, and
   nav states (transparent over the home hero, glass after scrolling past it).
4. **Transitions and extras.** Native view transitions, shared site name, small
   touches, 404 page, OG image.
5. **Verify and ship.** See the checklist below. Also update each GitHub Action in
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

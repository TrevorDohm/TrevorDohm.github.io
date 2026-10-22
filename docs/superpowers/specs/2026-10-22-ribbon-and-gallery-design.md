# Word ribbon and attention gallery: design

*Agreed with Trevor on 2026-10-22 over a mockup session. Decisions marked
**(Trevor)** are his; decisions marked **(my call)** were delegated ("use your
best judgement") and can be overridden. Everything else follows `PLAN.md` and
`CLAUDE.md`.*

**Mockups.** The approved mockups are in
`2026-10-22-ribbon-and-gallery-mockups/`. Open them in a browser:
`ribbon.html` (the chosen ribbon is panel 2, "Category-colored cells") and
`gallery.html`. They are throwaway prototypes: match their look and motion,
not their code. Where the text and a mockup disagree, the text wins.

## Why

Trevor wants the site to feel more elegant, and he likes the slow, continuously
drifting carousels on polished product sites. He also wants the site to show
more than the resume: the baking and hiking that people enjoy asking him about,
next to the AI and MBA work **(Trevor)**. Two pieces do this:

1. **Word ribbon.** A typographic band of huge drifting words that mixes ML,
   MBA, baking, and hiking. It is the "this person is interesting" moment.
2. **Attention gallery.** A slow strip of cards, each a live attention pattern
   drawn with the hero's visual language. It carries the matrix motif down the
   page and gives a light, readable glimpse of the ML side.

**Success:** a visitor remembers the site, and the content stays as easy to read
as before (the overhaul goal in `PLAN.md`).

**Anti-goals:** motion that makes the page harder to read, motion that cannot be
stopped, a ribbon that outshines the projects, or copy that invents facts about
Trevor.

## Research behind the choices

Measured on live sites on 2026-10-22 (source read directly; Vercel's 50 s
duration re-checked by hand):

- Every well-regarded marquee runs at **19 to 40 px/s**: Vercel 19, Linear 24,
  Clerk 25 and 35, Stripe 30, Resend 40. Faster reads as cheap.
- Edge fades use `mask-image`, not overlay gradients. Linear's eased three-stop
  fade (`transparent → #0003 at 32px → #000 at ~64-96px`) is the most refined.
- Seamless loops use two identical tracks animated by `translateX(-100%)`.
- Rows at different speeds or opposite directions (Clerk, Apple Arcade) feel
  alive; identical rows feel mechanical.
- Nobody eases down on hover; they all hard-stop. Easing to quarter speed is a
  small differentiator.
- WCAG 2.2 SC 2.2.2: moving content that starts automatically and lasts over
  5 s needs a mechanism to pause it. The W3C Understanding document says motion
  that stops "only so long as a user has focus on it" is not such a mechanism,
  so hover-pause alone fails. A visible pause control is required (checked
  against the W3C page).

## Page order

Hero → (phase 3 stats strip) → **Ribbon** → Selected Work → **Gallery** →
Contact **(my call)**.

The stats strip is a calm band that separates the matrix from the ribbon, so
two glowing, moving things are never adjacent. Until phase 3 lands, the ribbon
sits directly under the hero. Record this order as a decision in `PLAN.md`.

## Part 1: Word ribbon

### Look **(Trevor: option "A with B's categories", variant 2)**

- Two rows of huge Geist words, `clamp(48px, 8vw, 104px)`, weight 600,
  letter-spacing about -0.035em, alternating solid (`foreground`) and outlined
  (1px text stroke).
- Between words: rounded cells like the hero's matrix cells, about 28px, radius
  7px, filled with the **category color**, and a small uppercase mono label
  under each cell naming the category (`ml`, `mba`, `bake`, `hike`). The cell
  sits *before* the word it labels.
- Hovering an outlined word tints its stroke in its category color.
- Eased `mask-image` edge fade on the static parent, Linear-style.
- No visible heading. The section has an `aria-label` (for example "Things I
  work on and love"), and the Pause button is a small mono pill at the top right
  of the band **(my call; as in the mockup)**.
- Glow: cells use a soft `box-shadow` in their color, kept **dimmer than the
  matrix glow** so the ribbon reads as a handoff from the hero, not a rival
  **(my call)**. No `filter: blur`.

### Category colors (verified)

Two new tokens in `tokens.css`, added to the palette table in `PLAN.md`:

| Category | Token | Hex | Contrast on `background` | on `surface` |
|---|---|---|---|---|
| ml | `accent` | `#7C9CFF` | 7.71 | 7.32 |
| mba | `accent-2` | `#B18CFF` | 7.72 | 7.33 |
| bake | `bake` (new) | `#E28D23` | 7.73 | 7.33 |
| hike | `hike` (new) | `#2AB580` | 7.68 | 7.29 |

Computed with the WCAG 2.x formula, which reproduces every existing figure in
`PLAN.md` exactly. These match the accents in OKLCH lightness (0.69 to 0.72) and
chroma (0.14 to 0.15), so all four read as one set. The first drafts
(`#E8B27C`, `#8FD0A8`) were rejected because at 10.6 to 11.3:1 they looked
pastel next to the accents.

Known limit: under protanopia and deuteranopia, `accent` and `accent-2` become
nearly identical (OKLab ΔE about 0.02). That is a property of the existing
tokens. The text labels carry the category in words, so color is never the only
signal (SC 1.4.1). The labels use the category color at 11px, which passes AA
at about 7.7:1.

### Motion

- Row 1 drifts left at **22 px/s**, row 2 right at **30 px/s** (computed:
  duration = track width ÷ speed, so speed stays constant whatever the content).
- Hovering the ribbon eases playback rate to **0.25** and back, via
  `getAnimations()` and `updatePlaybackRate`, lerped each frame.
- A visible **Pause / Play** button, first in tab order inside the section.
  Paused means paused until the user presses Play.
- Pauses when offscreen (IntersectionObserver) and when the tab is hidden.
- Starts after the `load` event, like the matrix.

### Content

Lives in a new `src/data/interests.ts` as `{ label, category }` entries. Only
`index.astro` imports it and passes it down as props. About 8 items per row,
chosen and interleaved at build time so categories alternate.

Sources for each category:

- **ml:** items that trace to `projects.ts` / `experience.ts`, such as
  Cottention (use this name, not "Cosine Attention"), CUDA Kernels, Linear
  Transformers, Agents, Air-Gapped LLMs.
- **mba:** Wharton, Quant Finance (traces to `experience.ts`), plus topical
  words such as Options Pricing and Black–Scholes **(Trevor: creative, topical
  words are fine)**.
- **bake:** Trevor's own bakes (Blueberry Yuzu Cookies, Raspberry Kouign Amann,
  Piña Colada Danish) and anything on the Bresnan Bread & Pastry menu, which he
  baked as Operations Lead and Overnight Pastry Baker there (2025 to 2026, per
  his MBA resume) **(Trevor)**. Good picks from the menu: Orange Cardamom
  Morning Bun, Country Sourdough, Milk Tea Danish, Elote Danish.
- **hike:** Half Dome, Angel's Landing, The Wave **(Trevor; also on both
  resumes)**, and Paintbrush Divide in Grand Teton National Park **(Trevor
  confirmed the name on 2026-10-22)**.
- One playful line is allowed, such as "Morning Buns at 3 a.m." (a nod to the
  overnight shifts).

Add the Bresnan role to `src/data/` so the bake items have a factual source.
Where it is displayed beyond the ribbon is left open.

### Accessibility and fallbacks

- The first track is a real `<ul>` read by screen readers. Only the clone gets
  `inert` and `aria-hidden="true"`.
- **Animation only runs after the script marks the root ready** (for example
  `data-ribbon-ready`). With JS off, the pause button cannot work, so there is
  no motion: the ribbon renders as a static row.
- **Reduced motion and JS off** share one static mode:
  - `animation: none`, set explicitly rather than relying on the global rule in
    `motion.css`
  - the clone hidden and the pause button hidden
  - the row scrolls horizontally, with `tabindex="0"`, `role="region"`, and an
    `aria-label`, so axe's `scrollable-region-focusable` passes
- The wrapper gets `overflow-x: clip`, so 4 to 6k px tracks can never widen the
  page at 375px.

### Implementation constraints from review

- **Seam:** the gap after the last item lives inside each track (padding-right),
  not between the tracks. Each copy must be at least as wide as the viewport,
  including at 2560px and up at the smallest clamp size. Add copies if not.
- **Font load:** recompute durations on `document.fonts.ready` and in a
  ResizeObserver. Rescale `currentTime` so progress is preserved, otherwise the
  row jumps. Reserve row height. CLS risk is low because transforms do not count
  and the font fallbacks are size-matched.
- **Layers:** no `will-change` on the running tracks. They are already
  composited, and the hint keeps large layers alive while paused.

## Part 2: Attention gallery

### What it is **(Trevor approved the mockup as shown)**

A section titled **"Ways to pay attention"**, with a mono eyebrow, then a
strip of six cards drifting left at **18 px/s**, slower than the ribbon because
the cards carry detail.

Each card is a `surface` panel, about 240px wide, laid out top to bottom:

- a square 12×12 attention map with the hero's look: rounded cells and the color
  ramp from `line` through `accent` to `accent-2`
- a row with the name on the left and a mono kind label on the right
- one plain caption line in `muted`

The section heading and the Pause pill sit on one row above the strip, as in
the mockup.

**JS off:** each map is pre-rendered at build time as a static frame, with the
query row in the middle, from the same pure pattern functions (inline SVG or a
CSS grid; builder's choice). The live canvas draws over it once the script runs.
This follows `CLAUDE.md`: content must stay visible if JavaScript fails. The
same static frame serves reduced motion.

| Card | Kind | Pattern | Caption |
|---|---|---|---|
| Full attention | softmax | dense, strongest near the diagonal | Every token looks at every other. Quadratic, and the reason long context is expensive. |
| Causal | decoder | lower triangle, decaying | Each token sees only what came before it. This is how GPT-style models write. |
| Sliding window | local | band of width 2 | Attend only to nearby tokens. Cheap, and often good enough. |
| Block-sparse | global + local | global first row/column, local band, sparse random links | A few global tokens, a local window, and random links between them. |
| **Cottention** | cosine | smooth, broad | Cosine similarity instead of softmax. Linear memory in sequence length. |
| Induction head | copy | offset diagonal plus a faint diagonal | Finds where the current token appeared before and looks just after it. |

- Weights are row-normalized. Patterns are deterministic, using a seeded hash
  rather than `Math.random`, so builds and tests are stable.
- The Cottention caption traces to the blurb in `projects.ts`. The other
  captions describe general ML, not Trevor's work.
- The Cottention card is visually set apart (accent border and ↗) and links to
  the paper. When the phase 5 `/research` page exists, it links there instead
  **(my call)**.
- The final caption copy follows the `no-ai-slop` rules. The table above is the
  starting draft.

### Motion

- A highlighted query row sweeps down each map at about 1.6 rows per second,
  and cell brightness eases toward its target, as the hero's weights do.
- Hovering a card makes the cursor's vertical position the query row, echoing
  the hero. The card lifts about 4px, and the strip eases to quarter speed.
- It uses the same marquee module as the ribbon, with a pause button, offscreen
  pause, reduced motion and JS-off behavior identical to Part 1.
- All cards share **one** rAF loop capped at 30fps, and only cards
  intersecting the viewport are drawn. The cloned track mirrors the original
  canvases with `drawImage`, so each pattern is computed once.
- With reduced motion, each card draws one static frame (query row in the
  middle) and the strip becomes the scrollable static row.

## Code layout **(my call, following PLAN.md's structure rules)**

```
src/data/interests.ts            ribbon items, Bresnan role
src/components/home/Ribbon.astro      section, pause button, two rows
src/components/home/Gallery.astro     section heading, pause button, strip
src/components/ui/MarqueeRow.astro    one masked row: track + inert clone (shared)
src/components/ui/PatternCard.astro   canvas + name + kind + caption
src/lib/marquee/                 pure: durationSeconds, copiesNeeded,
                                 rescaleCurrentTime, lerpRate; index.ts init(root)
src/lib/patterns/                pure: one weight function per pattern,
                                 rowNormalize, seeded hash; index.ts init(root)
src/lib/motion/prefers-reduced-motion.ts   shared check (listed in PLAN.md, not yet built)
```

- Every pure function has a Vitest test beside it, written first.
- Each behavior exports `init(root): () => void` and stays inside its root.
- Reuse the easing in `src/lib/matrix/math.ts` / `attention.ts` instead of
  duplicating it, and reuse the matrix color ramp in `color.ts` for the cards.
- Files stay under about 150 lines.
- JS budget: the site ships about 3.2 KB gzipped today (measured from `dist/`).
  Ribbon plus gallery should add about 3 KB, well under the 15 KB cap.

## Build order

1. **Ribbon** ships first as its own stage, since it stands alone and is the
   most visible change.
2. **Gallery** second, reusing the marquee module.
3. The rest of phase 3 continues afterwards. Update `PLAN.md`'s phase table to
   insert this as its own stage. In the same edit, fix the stale status line:
   phases 1 and 2 are merged to `master` and live, not only "on branch
   `design-overhaul`".

Pause applies to everything in its section, including the sweep inside each
gallery card.

## Done means

- `npm test` and `npm run build` pass with 0 errors.
- Measured speeds are within ±10% of 22, 30 and 18 px/s.
- Pause stops all motion and stays stopped. Hover eases rather than snaps.
- Reduced motion and JS off: no motion, all items readable, the row is
  keyboard-scrollable, and the pause button is hidden.
- Screen reader reads each item once.
- No horizontal page scroll at 375px. No visible seam at 375, 1440 and 2560px.
- Animations pause offscreen, verified in a DevTools performance trace.
- Lighthouse Accessibility stays at 100.

## Left to the builder

- Exact item lists per row, within the sources above.
- Pattern weight formulas, provided each card is recognizably its pattern at
  12×12.
- Card size (the mockup used 240px), cell spacing, and fade widths.
- Whether `MarqueeRow` handles both text and card content, or there are two
  thin wrappers.

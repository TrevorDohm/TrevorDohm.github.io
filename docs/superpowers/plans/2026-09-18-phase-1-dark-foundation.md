# Phase 1: Dark Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the site to the dark design and restructure the code into the modular layout from PLAN.md, with Vitest in place, leaving every page working and shippable.

**Architecture:** Styles split into token, base, utility, and motion files imported by `global.css`. Components are grouped by area (`layout/`, `ui/`, `home/`, `projects/`, `experience/`), receive data through props, and pages compose them. Pure logic lives in `src/lib/` with Vitest tests beside it.

**Tech Stack:** Astro 7.3, Tailwind CSS 4.3 (CSS-first config), TypeScript, Vitest 5, Astro Fonts API (Google provider), `astro:assets`.

**Spec:** `PLAN.md`, section "Now: Design overhaul". Read "Look", "Code structure", and "Phases" before starting.

## Global Constraints

- Dark only. Palette: `background #07070B`, `surface #0F0F16`, `line #1E1E2A`, `foreground #EDEDF3`, `muted #9494A8`, `accent #7C9CFF`, `accent-2 #B18CFF`.
- `line` is never a text color (1.22:1 contrast).
- Fonts: Geist (sans) and Geist Mono, self-hosted via Astro's `fonts` config. No `@import` from Google Fonts.
- No UI framework, no animation libraries. Client JS is plain TypeScript.
- Only pages and layouts import from `src/data/`. Components get data through props.
- Client behaviors export `init(root: HTMLElement): () => void`.
- Pure logic has no `document`/`window` access and has Vitest tests beside it (`foo.test.ts` next to `foo.ts`).
- Files target under ~150 lines.
- Every animation respects `prefers-reduced-motion`.
- The hero `<h1>` must never start at `opacity: 0` (it is the LCP element).
- Site copy follows the no-ai-slop skill: no em dashes in prose, no puffery.
- Commit messages follow repo style: sentence case, imperative, no `feat:` prefix, ending with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Environment

Node 22 comes from fnm. Non-interactive shells may not have it on PATH, so prefix Node commands with:

```bash
export PATH="/opt/homebrew/bin:$PATH" && eval "$(fnm env --shell zsh)" && fnm use 22 >/dev/null
```

Work happens on branch `design-overhaul` in `/Users/tdohm/code/website`. Do not push or merge.

## File map

| File | Status | Responsibility |
|---|---|---|
| `vitest.config.ts` | Create | Vitest config via Astro's `getViteConfig` |
| `src/lib/nav.ts` (+ `.test.ts`) | Create | Pure: which nav link is active for a path |
| `src/lib/nav-menu.ts` | Create | Behavior: close the mobile menu on outside click / Escape |
| `astro.config.mjs` | Modify | Add `fonts` config |
| `src/styles/tokens.css` | Create | Colors, font families, animation tokens (`@theme`) |
| `src/styles/base.css` | Create | Element defaults, focus ring, selection, film grain |
| `src/styles/utilities.css` | Create | `section-container`, heading utilities, `eyebrow`, `link-underline` |
| `src/styles/motion.css` | Create | Keyframes and the reduced-motion rule |
| `src/styles/global.css` | Rewrite | Imports the four files above in order |
| `src/components/ui/Button.astro` | Create | Primary/secondary link button |
| `src/components/ui/Tag.astro` | Create | Small mono label chip |
| `src/components/ui/SectionHeading.astro` | Create | Eyebrow + heading + optional slot |
| `src/components/ui/SpotlightCard.astro` | Create | Card shell; `data-spotlight` hook for phase 3 |
| `src/components/layout/Nav.astro` | Move + rewrite | Glass nav, props-driven |
| `src/components/layout/Footer.astro` | Move + rewrite | Footer, props-driven |
| `src/layouts/BaseLayout.astro` | Rewrite | Head, fonts, builds nav/footer props from data |
| `src/components/projects/ProjectCard.astro` | Move + rewrite | One project, using `SpotlightCard` + `Tag` |
| `src/components/home/Hero.astro` | Create | Name, tagline, buttons, static gradient background |
| `src/components/home/SelectedWork.astro` | Create | Featured projects section |
| `src/components/home/Contact.astro` | Create | Contact rows + optimized photo |
| `src/components/experience/TimelineItem.astro` | Create | One role or school on the timeline |
| `src/pages/index.astro` | Rewrite | Composes home sections |
| `src/pages/projects.astro` | Rewrite | Projects page, dark |
| `src/pages/experience.astro` | Rewrite | Experience page, dark |
| `src/data/site.ts` | Modify | Add `role` |
| `src/assets/pfp.jpg` | Create (copy) | Source image for `astro:assets`. `public/pfp.jpg` stays until the phase 4 OG image replaces it |
| `.github/workflows/deploy.yml` | Modify | Run `npm test` before build |
| `package.json` | Modify | `test` script, `vitest` devDependency |

---

### Task 1: Vitest and the nav path helper

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/nav.ts`
- Test: `src/lib/nav.test.ts`
- Modify: `package.json` (scripts)
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `normalizePath(path: string): string` and `isActivePath(pathname: string, href: string): boolean` from `src/lib/nav.ts`. Task 4's Nav uses `isActivePath`.

The current Nav uses `path.startsWith(href)`, which wrongly marks `/projects` active on a page like `/projects-archive`. This task fixes that with a test.

- [ ] **Step 1: Install Vitest and add the test script**

```bash
cd /Users/tdohm/code/website && npm install -D vitest
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Write the failing test** at `src/lib/nav.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { isActivePath, normalizePath } from './nav'

describe('normalizePath', () => {
  it('keeps the root path', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('strips trailing slashes', () => {
    expect(normalizePath('/projects/')).toBe('/projects')
    expect(normalizePath('/projects//')).toBe('/projects')
  })
})

describe('isActivePath', () => {
  it('matches home only on the root path', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/projects', '/')).toBe(false)
  })

  it('matches a section with or without a trailing slash', () => {
    expect(isActivePath('/projects', '/projects')).toBe(true)
    expect(isActivePath('/projects/', '/projects')).toBe(true)
  })

  it('matches pages nested under a section', () => {
    expect(isActivePath('/projects/cottention', '/projects')).toBe(true)
  })

  it('does not match a path that only shares a prefix', () => {
    expect(isActivePath('/projects-archive', '/projects')).toBe(false)
  })
})
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL, `Failed to resolve import "./nav"` (the module doesn't exist yet).

- [ ] **Step 5: Implement `src/lib/nav.ts`**

```ts
/**
 * Nav highlighting. Pure (no DOM access) so it can be unit tested.
 */
export function normalizePath(path: string): string {
  if (path === '/') return '/'
  return path.replace(/\/+$/, '')
}

export function isActivePath(pathname: string, href: string): boolean {
  const current = normalizePath(pathname)
  const target = normalizePath(href)
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS, 6 tests in `src/lib/nav.test.ts`.

- [ ] **Step 7: Run tests in CI before the build.** In `.github/workflows/deploy.yml`, change

```yaml
      - run: npm ci

      - run: npm run build
```

to

```yaml
      - run: npm ci

      - run: npm test

      - run: npm run build
```

- [ ] **Step 8: Confirm the site still builds**

Run: `npm run build`
Expected: `0 errors`, `3 page(s) built`. `astro check` must accept `vitest.config.ts` and the test file.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/nav.ts src/lib/nav.test.ts .github/workflows/deploy.yml
git commit -m "Add Vitest and a tested nav path helper

isActivePath fixes prefix matching: /projects is no longer marked
active on a path like /projects-archive. CI now runs tests before
the build.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Dark tokens, self-hosted fonts, and the split stylesheet

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/utilities.css`, `src/styles/motion.css`
- Rewrite: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro` (add `<Font />`)

**Interfaces:**
- Produces: Tailwind utilities `bg-background`, `bg-surface`, `border-line`, `text-foreground`, `text-muted`, `text-accent`, `text-accent-2`, `font-sans`, `font-mono`, `animate-fade-in`, `animate-fade-in-up`; custom utilities `section-container`, `heading-xl`, `heading-lg`, `body-lg`, `eyebrow`; class `link-underline`. All later tasks use these. The old `subtle` and `accent-dark` tokens are removed; Tasks 3 to 6 replace every use.

No unit test: this task is CSS and config. Verification is the build plus checks on the output.

- [ ] **Step 1: Add fonts to `astro.config.mjs`.** Replace the whole file with:

```js
// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// Deployed to GitHub Pages as a *user* site (TrevorDohm.github.io), so the
// site is served from the domain root and needs no `base` path.
export default defineConfig({
  site: 'https://trevordohm.github.io',
  integrations: [sitemap()],
  // Self-hosted at build time, with size-matched fallbacks to limit layout shift.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Geist',
      cssVariable: '--font-geist',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

- [ ] **Step 2: Create `src/styles/tokens.css`**

```css
/* Design tokens. Tailwind v4 turns each --color-* into utilities such as
   bg-surface and text-muted. Contrast ratios are in PLAN.md. */
@theme {
  --color-background: #07070b;
  --color-surface: #0f0f16;
  --color-line: #1e1e2a;
  --color-foreground: #ededf3;
  --color-muted: #9494a8;
  --color-accent: #7c9cff;
  --color-accent-2: #b18cff;

  --animate-fade-in: fade-in 0.5s ease-out forwards;
  --animate-fade-in-up: fade-in-up 0.7s ease-out forwards;
}

/* `inline` so utilities reference the variables Astro's <Font /> defines. */
@theme inline {
  --font-sans: var(--font-geist);
  --font-mono: var(--font-geist-mono);
}
```

- [ ] **Step 3: Create `src/styles/base.css`**

```css
@layer base {
  html {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    color-scheme: dark;
  }

  body {
    @apply antialiased;
  }

  ::selection {
    background-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
    color: var(--color-foreground);
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      scroll-behavior: smooth;
    }
  }
}

/* Film grain over the whole page: static SVG noise, no JS. */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

- [ ] **Step 4: Create `src/styles/utilities.css`**

```css
@utility section-container {
  @apply mx-auto max-w-5xl px-6 sm:px-8;
}

@utility heading-xl {
  @apply text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl;
}

@utility heading-lg {
  @apply text-2xl font-semibold tracking-tight sm:text-3xl;
}

@utility body-lg {
  @apply text-lg leading-relaxed text-muted;
}

/* Small mono label above headings. */
@utility eyebrow {
  @apply font-mono text-xs uppercase tracking-[0.2em] text-accent;
}

/* Underline that grows from left to right on hover. */
.link-underline {
  position: relative;
}
.link-underline::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  display: block;
  margin-top: 2px;
  right: 0;
  background: currentColor;
  transition: width 0.3s ease;
}
.link-underline:hover::after {
  width: 100%;
  left: 0;
  right: auto;
}
```

- [ ] **Step 5: Create `src/styles/motion.css`**

```css
@keyframes fade-in {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-up {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Users who ask for less motion get none. Phase 3's scroll-driven
   animations use a no-preference guard instead of relying on this. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Replace `src/styles/global.css`** with:

```css
@import 'tailwindcss';
@import './tokens.css';
@import './base.css';
@import './utilities.css';
@import './motion.css';
```

- [ ] **Step 7: Load the fonts in `src/layouts/BaseLayout.astro`.** Add this import as the first line inside the frontmatter:

```ts
import { Font } from 'astro:assets'
```

and add these two lines in `<head>` directly after `<meta name="viewport" ...>`:

```astro
    <Font cssVariable="--font-geist" preload />
    <Font cssVariable="--font-geist-mono" />
```

- [ ] **Step 8: Build and check the output**

```bash
npm run build
grep -c "fonts.googleapis" dist/index.html || true
grep -o 'rel="preload"[^>]*font[^>]*' dist/index.html | head -2
```

Expected: `0 errors`; the googleapis count is `0`; at least one font `preload` link is printed. If `astro check` rejects the `preload` prop on `<Font />`, look up the current prop name with context7 (`/withastro/docs`, "Font component preload") rather than guessing.

- [ ] **Step 9: Commit**

```bash
git add astro.config.mjs src/styles src/layouts/BaseLayout.astro
git commit -m "Add dark design tokens and self-hosted Geist fonts

Splits global.css into tokens, base, utilities, and motion files, and
replaces the render-blocking Google Fonts import with Astro's fonts
config. Components still use old color names until the next tasks.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: UI primitives

**Files:**
- Create: `src/components/ui/Button.astro`, `src/components/ui/Tag.astro`, `src/components/ui/SectionHeading.astro`, `src/components/ui/SpotlightCard.astro`

**Interfaces:**
- Produces (props, used by Tasks 4 to 6):
  - `Button`: `{ href: string; variant?: 'primary' | 'secondary'; external?: boolean }`, default slot for the label
  - `Tag`: `{ label: string }`
  - `SectionHeading`: `{ title: string; eyebrow?: string; level?: 'h1' | 'h2' }`, default slot rendered under the heading
  - `SpotlightCard`: `{ as?: 'article' | 'div'; featured?: boolean }`, default slot; renders `data-spotlight` for phase 3

No unit tests: these are presentational. They are verified through the pages in Tasks 5 and 6.

- [ ] **Step 1: Create `src/components/ui/Button.astro`**

```astro
---
interface Props {
  href: string
  variant?: 'primary' | 'secondary'
  external?: boolean
}

const { href, variant = 'primary', external = false } = Astro.props
---

<a
  href={href}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
  class:list={[
    'inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors',
    variant === 'primary'
      ? 'bg-foreground text-background hover:bg-accent'
      : 'border border-line bg-surface text-foreground hover:border-accent/60',
  ]}
>
  <slot />
</a>
```

- [ ] **Step 2: Create `src/components/ui/Tag.astro`**

```astro
---
interface Props {
  label: string
}

const { label } = Astro.props
---

<span class="rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs text-muted">
  {label}
</span>
```

- [ ] **Step 3: Create `src/components/ui/SectionHeading.astro`**

```astro
---
interface Props {
  title: string
  eyebrow?: string
  level?: 'h1' | 'h2'
}

const { title, eyebrow, level = 'h2' } = Astro.props
const Heading = level
---

<div class="mb-8">
  {eyebrow && <p class="eyebrow mb-3">{eyebrow}</p>}
  <Heading class={level === 'h1' ? 'heading-xl' : 'heading-lg'}>{title}</Heading>
  <slot />
</div>
```

- [ ] **Step 4: Create `src/components/ui/SpotlightCard.astro`**

```astro
---
interface Props {
  as?: 'article' | 'div'
  featured?: boolean
}

const { as: Element = 'article', featured = false } = Astro.props
---

<!-- data-spotlight is the hook for the cursor glow added in phase 3. -->
<Element
  data-spotlight
  class:list={[
    'relative rounded-xl border border-line bg-surface transition-colors hover:border-accent/40',
    featured ? 'p-8' : 'p-6',
  ]}
>
  <slot />
</Element>
```

- [ ] **Step 5: Type-check**

Run: `npx astro check`
Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui
git commit -m "Add UI primitives: Button, Tag, SectionHeading, SpotlightCard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Layout: props-driven nav and footer

**Files:**
- Move + rewrite: `src/components/Nav.astro` → `src/components/layout/Nav.astro`
- Move + rewrite: `src/components/Footer.astro` → `src/components/layout/Footer.astro`
- Create: `src/lib/nav-menu.ts`
- Rewrite: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `isActivePath` from `src/lib/nav.ts` (Task 1).
- Produces:
  - `Nav` props: `{ siteName: string; items: readonly { href: string; label: string }[]; pathname: string }`
  - `Footer` props: `{ name: string; links: { label: string; href: string; external: boolean }[] }`
  - `init(root: HTMLElement): () => void` from `src/lib/nav-menu.ts`. Looks for `[data-nav-menu]` (a `<details>`) inside `root`.

- [ ] **Step 1: Move the files so git records the rename**

```bash
mkdir -p src/components/layout
git mv src/components/Nav.astro src/components/layout/Nav.astro
git mv src/components/Footer.astro src/components/layout/Footer.astro
```

- [ ] **Step 2: Create `src/lib/nav-menu.ts`**

```ts
/**
 * Closes the mobile <details> menu on an outside click or Escape.
 * Listens on document (clicks outside the root must be seen) but only
 * changes the menu inside `root`.
 */
export function init(root: HTMLElement): () => void {
  const menu = root.querySelector<HTMLDetailsElement>('[data-nav-menu]')
  if (!menu) return () => {}

  const onClick = (e: MouseEvent) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false
      menu.querySelector('summary')?.focus()
    }
  }

  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKey)
  return () => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKey)
  }
}
```

- [ ] **Step 3: Rewrite `src/components/layout/Nav.astro`**

```astro
---
import { isActivePath } from '../../lib/nav'

interface Props {
  siteName: string
  items: readonly { href: string; label: string }[]
  pathname: string
}

const { siteName, items, pathname } = Astro.props
const links = items.map((item) => ({ ...item, active: isActivePath(pathname, item.href) }))
---

<header
  data-nav
  class="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-background/70 backdrop-blur-md"
>
  <nav class="section-container py-4" aria-label="Main">
    <div class="flex items-center justify-between">
      <a href="/" class="font-medium tracking-tight transition-opacity hover:opacity-70">
        {siteName}
      </a>

      <div class="hidden gap-1 md:flex">
        {links.map((link) => (
          <a
            href={link.href}
            aria-current={link.active ? 'page' : undefined}
            class:list={[
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              link.active
                ? 'bg-surface text-foreground ring-1 ring-line'
                : 'text-muted hover:text-foreground',
            ]}
          >
            {link.label}
          </a>
        ))}
      </div>

      <!-- <details> so the menu opens without JavaScript. -->
      <details class="relative md:hidden" data-nav-menu>
        <summary
          class="list-none cursor-pointer p-2 text-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
          aria-label="Open menu"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </summary>
        <div class="absolute right-0 mt-2 w-48 rounded-lg border border-line bg-surface p-1 shadow-xl shadow-black/40">
          {links.map((link) => (
            <a
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              class:list={[
                'block rounded-md px-3 py-2 text-sm hover:bg-background',
                link.active ? 'text-foreground' : 'text-muted',
              ]}
            >
              {link.label}
            </a>
          ))}
        </div>
      </details>
    </div>
  </nav>
</header>

<script>
  import { init } from '../../lib/nav-menu'

  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((root) => init(root))
</script>
```

- [ ] **Step 4: Rewrite `src/components/layout/Footer.astro`**

```astro
---
interface Props {
  name: string
  links: { label: string; href: string; external: boolean }[]
}

const { name, links } = Astro.props
const year = new Date().getFullYear()
---

<footer class="mt-24 border-t border-line">
  <div class="section-container flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
    <p class="font-mono text-xs text-muted">© {year} {name}</p>
    <ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {links.map((link) => (
        <li>
          <a
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            class="link-underline text-muted transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
</footer>
```

- [ ] **Step 5: Rewrite `src/layouts/BaseLayout.astro`** (keeps Task 2's `<Font />` lines)

```astro
---
import { Font } from 'astro:assets'
import { site, nav } from '../data/site'
import Nav from '../components/layout/Nav.astro'
import Footer from '../components/layout/Footer.astro'
import '../styles/global.css'

interface Props {
  title?: string
  description?: string
}

const { title, description = site.description } = Astro.props

const pageTitle = title ? `${title} — ${site.name}` : site.name
const canonical = new URL(Astro.url.pathname, Astro.site).href
const ogImage = new URL('/pfp.jpg', Astro.site).href

const { links, privacy } = site
const footerLinks = [
  { label: 'LinkedIn', href: links.linkedin, external: true },
  { label: 'GitHub', href: links.github, external: true },
  { label: 'Hugging Face', href: links.huggingface, external: true },
  ...(privacy.showEmail
    ? [{ label: 'Email', href: `mailto:${links.email}`, external: false }]
    : []),
]
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <Font cssVariable="--font-geist" preload />
    <Font cssVariable="--font-geist-mono" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="generator" content={Astro.generator} />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />

    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={pageTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />

    <link rel="sitemap" href="/sitemap-index.xml" />
  </head>

  <body class="flex min-h-screen flex-col bg-background text-foreground">
    <Nav siteName={site.name} items={nav} pathname={Astro.url.pathname} />
    <main class="flex-1">
      <slot />
    </main>
    <Footer name={site.name} links={footerLinks} />
  </body>
</html>
```

- [ ] **Step 6: Build**

Run: `npm test && npm run build`
Expected: tests PASS; build `0 errors`, `3 page(s) built`.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout src/lib/nav-menu.ts src/layouts/BaseLayout.astro
git commit -m "Move nav and footer to layout/ and drive them with props

The layout now owns site data and passes it down. The mobile menu
script becomes an init(root) module, and nav highlighting uses the
tested isActivePath helper.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Home page sections and the optimized photo

**Files:**
- Create: `src/assets/pfp.jpg` (copy of `public/pfp.jpg`)
- Move + rewrite: `src/components/ProjectCard.astro` → `src/components/projects/ProjectCard.astro`
- Create: `src/components/home/Hero.astro`, `src/components/home/SelectedWork.astro`, `src/components/home/Contact.astro`
- Modify: `src/data/site.ts` (add `role`)
- Rewrite: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Button`, `Tag`, `SectionHeading`, `SpotlightCard` (Task 3); `Project` type from `src/data/projects.ts`.
- Produces:
  - `ProjectCard` props: `{ project: Project }`
  - `Hero` props: `{ name: string; tagline: string; role: string; location: string; linkedin: string }`. Renders an empty `<div data-hero-canvas>` that phase 2 mounts the matrix into.
  - `SelectedWork` props: `{ projects: Project[] }`
  - `Contact` props: `{ name: string; linkedin: string; email?: string; phone?: string; clearance?: string }`

- [ ] **Step 1: Copy the photo and move the card**

```bash
mkdir -p src/assets src/components/projects src/components/home
cp public/pfp.jpg src/assets/pfp.jpg
git mv src/components/ProjectCard.astro src/components/projects/ProjectCard.astro
```

`public/pfp.jpg` stays: the OG meta tag still points at it until phase 4.

- [ ] **Step 2: Add `role` to `src/data/site.ts`.** After the `location` line, add:

```ts
  role: 'Software Engineer II at RTX · MBA Candidate at Wharton',
```

- [ ] **Step 3: Rewrite `src/components/projects/ProjectCard.astro`**

```astro
---
import type { Project } from '../../data/projects'
import SpotlightCard from '../ui/SpotlightCard.astro'
import Tag from '../ui/Tag.astro'

interface Props {
  project: Project
}

const { project } = Astro.props
const { featured = false } = project
---

<SpotlightCard featured={featured}>
  <div class="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <h3 class:list={[featured ? 'text-2xl' : 'text-xl', 'font-semibold tracking-tight']}>
      {project.title}
    </h3>
    {project.closedSource && (
      <span class="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
        internal
      </span>
    )}
  </div>

  <p class="mb-4 font-mono text-xs text-muted">
    {project.context} · {project.period}
  </p>

  <p class="mb-5 leading-relaxed">{project.blurb}</p>

  {featured && (
    <ul class="mb-5 space-y-2 text-muted">
      {project.points.map((point) => (
        <li class="flex gap-3">
          <span aria-hidden="true" class="select-none text-accent">▹</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  )}

  <div class="mb-5 flex flex-wrap gap-2">
    {project.tags.map((tag) => <Tag label={tag} />)}
  </div>

  {project.links.length > 0 && (
    <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {project.links.map((link) => (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          class="link-underline font-medium text-accent hover:text-foreground"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  )}
</SpotlightCard>
```

- [ ] **Step 4: Create `src/components/home/Hero.astro`**

```astro
---
import Button from '../ui/Button.astro'

interface Props {
  name: string
  tagline: string
  role: string
  location: string
  linkedin: string
}

const { name, tagline, role, location, linkedin } = Astro.props
---

<section class="relative isolate flex min-h-svh items-center overflow-hidden">
  <!-- Phase 2 mounts the attention matrix here. The gradient below stays as
       the fallback when JavaScript is off. -->
  <div data-hero-canvas aria-hidden="true" class="hero-backdrop absolute inset-0 -z-10"></div>

  <div class="section-container relative w-full pt-16">
    <p class="eyebrow mb-6 opacity-0 animate-fade-in">{location}</p>
    <!-- The h1 is the LCP element, so it is visible from the first paint. -->
    <h1 class="heading-xl max-w-3xl">{name}</h1>
    <p class="body-lg mt-6 max-w-2xl opacity-0 animate-fade-in-up" style="animation-delay: 0.15s">
      {tagline}
    </p>
    <p class="mt-3 font-mono text-sm text-muted opacity-0 animate-fade-in-up" style="animation-delay: 0.25s">
      {role}
    </p>
    <div class="mt-10 flex flex-wrap gap-4 opacity-0 animate-fade-in-up" style="animation-delay: 0.35s">
      <Button href="#contact">Get in touch</Button>
      <Button href={linkedin} variant="secondary" external>View LinkedIn</Button>
    </div>
  </div>
</section>

<style>
  .hero-backdrop {
    background:
      radial-gradient(ellipse 55% 50% at 70% 40%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 70%),
      radial-gradient(ellipse 40% 40% at 85% 70%, color-mix(in srgb, var(--color-accent-2) 14%, transparent), transparent 70%),
      linear-gradient(var(--color-line) 1px, transparent 1px) 0 0 / 48px 48px,
      linear-gradient(90deg, var(--color-line) 1px, transparent 1px) 0 0 / 48px 48px;
    mask-image: radial-gradient(ellipse 80% 70% at 60% 50%, black, transparent);
  }
</style>
```

- [ ] **Step 5: Create `src/components/home/SelectedWork.astro`**

```astro
---
import type { Project } from '../../data/projects'
import SectionHeading from '../ui/SectionHeading.astro'
import ProjectCard from '../projects/ProjectCard.astro'

interface Props {
  projects: Project[]
}

const { projects } = Astro.props
---

<section class="section-container py-24">
  <div class="flex flex-wrap items-end justify-between gap-x-4">
    <SectionHeading eyebrow="Work" title="Selected projects" />
    <a href="/projects" class="link-underline mb-8 text-sm text-muted hover:text-foreground">
      All projects →
    </a>
  </div>
  <div class="space-y-6">
    {projects.map((project) => <ProjectCard project={project} />)}
  </div>
</section>
```

- [ ] **Step 6: Create `src/components/home/Contact.astro`**

```astro
---
import { Image } from 'astro:assets'
import SectionHeading from '../ui/SectionHeading.astro'
import pfp from '../../assets/pfp.jpg'

interface Props {
  name: string
  linkedin: string
  email?: string
  phone?: string
  clearance?: string
}

const { name, linkedin, email, phone, clearance } = Astro.props

type Row = { label: string; value: string; href?: string; external?: boolean }
const rows: Row[] = []
if (email) rows.push({ label: 'Email', value: email, href: `mailto:${email}` })
rows.push({
  label: 'LinkedIn',
  value: linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
  href: linkedin,
  external: true,
})
if (phone) rows.push({ label: 'Phone', value: phone })
if (clearance) rows.push({ label: 'Clearance', value: clearance })
---

<section id="contact" class="section-container scroll-mt-20 py-24">
  <div class="grid gap-10 md:grid-cols-[auto_1fr] md:items-start">
    <Image
      src={pfp}
      alt={name}
      width={256}
      class="h-32 w-32 rounded-full object-cover ring-1 ring-line"
      style="object-position: center 20%;"
    />
    <div>
      <SectionHeading eyebrow="Contact" title="Get in touch">
        <p class="body-lg mt-4 max-w-2xl">
          Happy to talk about ML infrastructure, attention mechanisms, or agentic systems.
        </p>
      </SectionHeading>
      <dl class="space-y-4">
        {rows.map((row) => (
          <div class="flex gap-3">
            <dt class="w-24 shrink-0 font-mono text-xs uppercase tracking-wider text-muted leading-6">
              {row.label}
            </dt>
            <dd>
              {row.href ? (
                <a
                  href={row.href}
                  target={row.external ? '_blank' : undefined}
                  rel={row.external ? 'noopener noreferrer' : undefined}
                  class="link-underline hover:text-accent"
                >
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Rewrite `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/home/Hero.astro'
import SelectedWork from '../components/home/SelectedWork.astro'
import Contact from '../components/home/Contact.astro'
import { site } from '../data/site'
import { projects } from '../data/projects'

const { links, privacy } = site
---

<BaseLayout>
  <Hero
    name={site.name}
    tagline={site.tagline}
    role={site.role}
    location={site.location}
    linkedin={links.linkedin}
  />
  <SelectedWork projects={projects.filter((p) => p.featured)} />
  <Contact
    name={site.name}
    linkedin={links.linkedin}
    email={privacy.showEmail ? links.email : undefined}
    phone={privacy.showPhone ? site.phone : undefined}
    clearance={privacy.showClearance ? site.clearance : undefined}
  />
</BaseLayout>
```

- [ ] **Step 8: Build and check the photo**

```bash
npm test && npm run build
ls -l dist/_astro/*.webp 2>/dev/null | awk '{print $5, $9}'
```

Expected: `0 errors`. A webp of the photo appears in `dist/_astro/` well under 171 KB (expect roughly 10 to 30 KB).

- [ ] **Step 9: Commit**

```bash
git add src/assets src/components/home src/components/projects src/data/site.ts src/pages/index.astro
git commit -m "Split the home page into Hero, SelectedWork, and Contact sections

The page is now a list of section components fed by props. The photo
moves from the hero to the contact section and is served through
astro:assets at display size instead of the 171 KB original.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Projects and experience pages

**Files:**
- Create: `src/components/experience/TimelineItem.astro`
- Rewrite: `src/pages/projects.astro`, `src/pages/experience.astro`

**Interfaces:**
- Consumes: `SectionHeading`, `Tag` (Task 3); `ProjectCard` (Task 5); `experience`, `education`, `skills` from `src/data/experience.ts`.
- Produces: `TimelineItem` props: `{ title: string; subtitle: string; meta: string; note?: string; points: string[] }`. Renders an `<li>`, so callers wrap it in `<ol>`. Phase 3 animates the line and the dot (`[data-timeline-dot]`).

- [ ] **Step 1: Create `src/components/experience/TimelineItem.astro`**

```astro
---
interface Props {
  title: string
  subtitle: string
  meta: string
  note?: string
  points: string[]
}

const { title, subtitle, meta, note, points } = Astro.props
---

<li class="relative border-l border-line pl-8">
  <span
    data-timeline-dot
    aria-hidden="true"
    class="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-accent bg-background"
  ></span>
  <h3 class="text-lg font-semibold tracking-tight">{title}</h3>
  <p class="text-muted">{subtitle}</p>
  <p class="mt-1 font-mono text-xs text-muted">{meta}</p>
  {note && <p class="mt-3 text-sm italic text-muted">{note}</p>}
  {points.length > 0 && (
    <ul class="mt-4 space-y-2 text-muted">
      {points.map((point) => (
        <li class="flex gap-3">
          <span aria-hidden="true" class="select-none text-accent">▹</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  )}
</li>
```

- [ ] **Step 2: Rewrite `src/pages/experience.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import SectionHeading from '../components/ui/SectionHeading.astro'
import TimelineItem from '../components/experience/TimelineItem.astro'
import Tag from '../components/ui/Tag.astro'
import { experience, education, skills } from '../data/experience'
---

<BaseLayout
  title="Experience"
  description="Trevor Dohm's professional experience at RTX, SMU, and Croquet, plus education and technical skills."
>
  <div class="section-container pb-24 pt-32">
    <SectionHeading level="h1" eyebrow="Career" title="Experience" />
    <ol class="space-y-12">
      {experience.map((role) => (
        <TimelineItem
          title={role.role}
          subtitle={role.org}
          meta={`${role.location} · ${role.period}`}
          note={role.note}
          points={role.points}
        />
      ))}
    </ol>

    <section class="mt-24">
      <SectionHeading title="Education" />
      <ol class="space-y-10">
        {education.map((ed) => (
          <TimelineItem
            title={ed.school}
            subtitle={ed.degree}
            meta={`${ed.location} · ${ed.period}`}
            points={ed.points}
          />
        ))}
      </ol>
    </section>

    <section class="mt-24">
      <SectionHeading title="Skills" />
      <dl class="space-y-6">
        {skills.map((group) => (
          <div>
            <dt class="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">{group.group}</dt>
            <dd class="flex flex-wrap gap-2">
              {group.items.map((item) => <Tag label={item} />)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Rewrite `src/pages/projects.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import SectionHeading from '../components/ui/SectionHeading.astro'
import ProjectCard from '../components/projects/ProjectCard.astro'
import { projects } from '../data/projects'

const featured = projects.filter((p) => p.featured)
const rest = projects.filter((p) => !p.featured)
---

<BaseLayout
  title="Projects"
  description="Research and engineering work by Trevor Dohm: linear attention, agentic AI systems, and the ML infrastructure underneath."
>
  <div class="section-container pb-12 pt-32">
    <SectionHeading level="h1" eyebrow="Work" title="Projects">
      <p class="body-lg mt-6 max-w-2xl">
        Published research on attention mechanisms, agentic systems running in
        air-gapped environments, and the GPU infrastructure underneath both.
      </p>
    </SectionHeading>
  </div>

  <div class="section-container space-y-6 pb-12">
    {featured.map((project) => <ProjectCard project={project} />)}
  </div>

  <section class="section-container pb-24">
    <SectionHeading title="More" />
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {rest.map((project) => <ProjectCard project={project} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Build**

Run: `npm test && npm run build`
Expected: `0 errors`, `3 page(s) built`.

- [ ] **Step 5: Confirm no old color classes remain**

```bash
grep -rnE "bg-subtle|accent-dark|bg-white|text-accent-dark" src/ || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Commit**

```bash
git add src/components/experience src/pages/projects.astro src/pages/experience.astro
git commit -m "Restyle projects and experience pages with shared components

Experience entries render through TimelineItem, and both pages use
SectionHeading and Tag instead of inline markup.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Verify phase 1

**Files:** none changed unless a check fails.

- [ ] **Step 1: Tests and build**

Run: `npm test && npm run build`
Expected: tests PASS, `0 errors`, `0 warnings`, `3 page(s) built`.

- [ ] **Step 2: Structure checks**

```bash
echo "--- files over 150 lines ---"; find src -name "*.astro" -o -name "*.ts" -o -name "*.css" | xargs wc -l | awk '$1>150 && $2!="total"' || true
echo "--- components importing src/data (should be none) ---"; grep -rln "data/site\|data/projects\|data/experience" src/components || echo "none"
echo "--- leftover files at old paths ---"; ls src/components/*.astro 2>/dev/null || echo "none"
echo "--- JS in dist ---"; find dist -name "*.js" -exec sh -c 'printf "%s %s B gz\n" "$1" "$(gzip -c "$1" | wc -c)"' _ {} \; ; grep -c "<script" dist/index.html
```

Expected: no files over 150 lines; `none` for data imports (type-only imports of `Project` from `data/projects` in components are allowed, so check any hit is `import type`); `none` for leftovers; JS limited to the small nav-menu script.

- [ ] **Step 3: Visual check in the browser.** Start the dev server (`.claude/launch.json` config `website`) and check each page at desktop width and at 375px:
  - `/`: dark background, grain visible up close, Geist font, gradient grid behind the hero, name visible immediately, contact section shows the round photo.
  - `/projects`: cards on `surface` with `line` borders; links in `accent`.
  - `/experience`: timeline line with accent dots; skills as mono tags.
  - Mobile: menu opens, closes on outside tap and on Escape, and focus returns to the menu button.
  - Keyboard: Tab through the home page; every link and button shows the accent focus ring.

- [ ] **Step 4: Reduced motion.** In the browser pane, emulate `prefers-reduced-motion: reduce` (DevTools rendering panel, or `matchMedia` check via the JS tool) and reload `/`. All hero text is visible with no movement.

- [ ] **Step 5: Update PLAN.md status and commit**

In `PLAN.md`, change the Design overhaul status row to:

```
| Design overhaul | **In progress.** Phase 1 (dark foundation) done on branch `design-overhaul` |
```

```bash
git add PLAN.md
git commit -m "Mark design overhaul phase 1 complete

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Stop and report.** Show the user screenshots of `/` at desktop and mobile width. Do not merge or push; phase 1 ships together with later phases unless the user asks to ship it on its own.

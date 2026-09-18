# CLAUDE.md

Trevor Dohm's personal site, live at https://trevordohm.github.io. Astro 7 +
Tailwind CSS 4, static output, deployed to GitHub Pages.

This file repeats the working rules from `PLAN.md` so every agent gets them on
startup. `PLAN.md` is the source of truth for design decisions. If this file and
`PLAN.md` disagree, follow `PLAN.md` and point out the mismatch.

## Where things are

- `PLAN.md`: goals, design decisions, code structure rules, phase status
- `docs/superpowers/plans/`: step-by-step implementation plans, one per phase
- `src/data/`: all site content (`site.ts`, `projects.ts`, `experience.ts`)
- `src/data/site.ts` `privacy`: toggles for what appears in the contact section.
  The phone number stays hidden unless Trevor says otherwise.

## Environment

Node 22 is managed by fnm and pinned in `.node-version`. Shells started by tools
may not have it on PATH, so prefix Node commands with:

```bash
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH" && eval "$(fnm env --shell zsh)" && fnm use 22 >/dev/null
```

```bash
npm run dev      # http://localhost:4321
npm test         # Vitest, pure modules only
npm run build    # astro check + build to dist/
```

A change is done when `npm test` and `npm run build` both pass with 0 errors.

## Code rules

1. One job per file. Pages compose sections, sections compose UI pieces. Target
   under ~150 lines per file.
2. Pages don't hold markup beyond composing components.
3. Only pages and layouts import from `src/data/`. Components get data through
   props. Type-only imports (`import type`) are fine anywhere.
4. Pure logic (math, formatting, path handling) lives in `src/lib/` with no
   `document` or `window` access, and has a Vitest test beside it
   (`foo.test.ts` next to `foo.ts`). Write the test first.
5. Every client-side behavior exports `init(root: HTMLElement): () => void`:
   set up on one root, return a cleanup function.
6. Styles: tokens in `src/styles/tokens.css`, element defaults in `base.css`,
   custom utilities in `utilities.css`, keyframes in `motion.css`.
7. No UI frameworks and no animation libraries. Client JS is plain TypeScript,
   total under 15 KB gzipped.

## Design rules

- Dark only. Use the color tokens (`background`, `surface`, `line`, `foreground`,
  `muted`, `accent`, `accent-2`), never raw hex in components.
- `line` is for borders and decoration only, never text (1.22:1 contrast).
- Fonts are Geist and Geist Mono, self-hosted through `astro.config.mjs`. Don't
  add Google Fonts `@import`s.
- Every animation respects `prefers-reduced-motion`.
- The hero `<h1>` is the LCP element and must never start at `opacity: 0`.
- Content must stay visible if JavaScript fails to load.

## Writing

Site copy, commit messages, and docs follow the `no-ai-slop` skill: no em dashes
in prose, no puffery, concrete facts over adjectives. Never invent claims about
Trevor's work; every fact must trace to `src/data/` or something Trevor said.

## Git

- Commit messages: sentence case, imperative, no `feat:` prefix. End with the
  `Co-Authored-By` line from the session's attribution instructions.
- Work on a feature branch. **Pushing to `master` deploys the live site**, so never
  push or merge without Trevor's go-ahead.

## Task tracking (beads)

Work items live in beads (`bd`), local to this machine. `.beads/` is excluded via
`.git/info/exclude` and must never be committed.

```bash
bd ready                       # tasks with no open blockers
bd show <id>                   # details, acceptance criteria, linked plan
bd update <id> --claim         # mark in progress
bd close <id> --reason "..."   # mark done, one line on what was verified
```

Issue descriptions point to the plan file and task number. The plan has the
exact steps; the issue's acceptance criteria say what "done" means.

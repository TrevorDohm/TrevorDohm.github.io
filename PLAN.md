# Website Rebuild Plan

**Repo:** `TrevorDohm/TrevorDohm.github.io`
**Drafted:** 2026-09-17 · **Revised:** 2026-09-17 (resumes received)
**Status:** Awaiting approval — no code written yet

---

## 1. Where things stand

The live site at `trevordohm.github.io` returns HTTP 200 but was last deployed
**2025-02-25** — roughly 19 months stale. The last commit is `d818839 Added basic
personalization`.

The honest assessment: **this site was never finished, rather than having decayed.**
Most of what's in the repo is scaffolding that was never connected to anything.

### Audit findings

| # | Finding | Location | Impact |
|---|---|---|---|
| 1 | **Portfolio content is orphaned.** A zustand store holds 3 real projects and 2 real jobs (RTX, Croquet) with full achievement bullets. Nothing imports it. | `src/store/useAppStore.ts` | **High** — but now largely superseded; see §4 |
| 2 | **Default Vite metadata.** Title is literally `Vite + React + TS`; favicon is `vite.svg`. | `index.html` | **High** — this is the Google result and browser tab today |
| 3 | **`Projects` and `Blog` pages are unreachable.** Both exist but are not routed. Both contain only placeholder text ("Project One", "First Blog Post"). | `src/pages/` | High |
| 4 | **`Navigation` is never rendered.** Links to `/projects`, `/blog`, `/contact` — none of which are routed. | `src/components/Navigation.tsx` | High |
| 5 | **"Get in touch" button is dead.** Scrolls to `#contact`; no such element exists anywhere in the app. | `src/components/Hero.tsx:8` | Medium |
| 6 | **Broken import in dead file.** `utils.ts` imports `clsx`, which is absent from both `package.json` and `node_modules`. Harmless only because nothing imports it. | `src/lib/utils.ts` | Low |
| 7 | **Unused dependencies.** `@tanstack/react-query` wraps the app with zero queries; `zustand` backs the orphaned store; `use-mobile.tsx` is unreferenced. | `package.json` | Low |
| 8 | **Deploys are manual.** Requires remembering to run `npm run deploy` locally. No CI. | — | Medium |
| 9 | **Stock README.** Still the Vite template boilerplate. | `README.md` | Low |

---

## 2. Decisions

### Stay on GitHub Pages — do not move to Vercel

The original question was whether to swap hosts. The answer is **no**, and the
deciding factor is the URL: `trevordohm.github.io` is granted by the repo name.
Vercel or Cloudflare would serve the same site at `*.vercel.app` or `*.pages.dev`
instead. Keeping the current URL means keeping GitHub Pages.

This only changes if a custom domain enters the picture later — at which point all
three hosts become equivalent and the choice comes down to preference.

### Rebuild in Astro

Astro emits real static HTML at build time. Three consequences that matter here:

1. **Routing is fixed for free.** The current `BrowserRouter` deep-links are broken
   on Pages — `/projects` 404s at GitHub's level and never reaches the app. (This is
   why a `HashRouter` sits commented out at the top of `App.tsx`; the problem was hit
   and worked around before.) Astro writes `/projects/index.html` to disk, so Pages
   serves it natively. No `404.html` hack, no hash URLs.
2. **Real SEO.** Per-page `<title>`, description, and OG tags in the served HTML
   rather than injected client-side.
3. **Much less JavaScript.** The page is static by default; React ships only where
   interactivity is genuinely used.

**Tradeoff accepted:** this is a rewrite, not a patch. Justified because — per the
audit — there is very little working UI to preserve. Roughly one functioning page.

### Blog: scaffold now, write later

Marked "maybe eventually." Astro content collections will be wired up and working
but ship with zero posts, so the nav omits Blog until a first post exists. Cost now
is near zero; retrofitting later would not be.

---

## 3. Scope

### Phase 1 — Foundation *(no content dependencies)*
- Scaffold Astro + Tailwind; port the existing dark theme and typography
- Base layout with `<head>` metadata, OG tags, favicon
- `Navigation` ported and **actually rendered** — fixing finding #4

### Phase 2 — Content
- **Lift `useAppStore.ts` into content data** — resolves finding #1, the core of this work
- `/` — hero, about, experience timeline (RTX, Croquet)
- `/projects` — the three real projects, with tag filtering (the store already
  anticipated this; the logic just never had a UI)
- Contact section, so the Hero button resolves — fixing finding #5

### Phase 3 — Polish & ship
- Keep Framer Motion in the Hero only, as a client-side island
- Blog collection scaffolded, empty
- GitHub Actions workflow: push to `master` → build → deploy. Ends manual deploys
- Rewrite `README.md`
- Drop `react-query`, `clsx`/`utils.ts`, `use-mobile` — findings #6 and #7

### Explicitly out of scope
- Custom domain
- CMS or admin UI — blog posts are Markdown files in the repo
- Analytics
- Writing actual blog posts

---

## 4. Content

### Sourcing rule

Two resumes provided, with different jobs:

- `Trevor_Dohm_Resume_AI.pdf` — deep technical detail (CUDA/Triton kernels, Nsight,
  SLURM, ChromaDB, EKS). **Stale on current facts:** says Dallas TX, no Wharton, and
  describes ATLAS only in its earlier "enterprise RAG infrastructure" form.
- `Trevor_Dohm_Resume_MBA_Draft.docx` — business framing, and **current**. Has
  Philadelphia, Wharton, ATLAS by name, SE II part-time arrangement. Still in draft.

**Rule: technical depth from the AI resume, current facts from the MBA draft.**
Per direction, the site leans technical — it is the counterpart to the
business-oriented resume, not a restatement of it.

### The site is materially out of date

| Currently on the site | Reality |
|---|---|
| "Triple Major in Computer Science, Mathematics, and Data Science" | Graduated SMU **May 2024**, Summa Cum Laude, 3.99 GPA. Now **Wharton MBA** candidate, Quantitative Finance, May 2028 |
| "Located in Dallas, TX" | **Philadelphia, PA** |
| Cottention "currently training and benchmarking" | **Published** — Computing Conference 2025, Springer LNNS, **Best Paper**; 3rd place college-wide showcase |
| *(absent)* | RTX **Software Engineer II** — promoted 9 months early; part-time 20 hrs/wk through MBA |
| *(absent)* | **ATLAS** — enterprise agentic AI platform; 12B open-weight LLM, q8 ONNX embeddings, air-gapped K8s, 100+ agent tools |

This confirms the two date-sensitive items flagged in the first draft. Both were wrong.

### Proposed structure

**`/` — Home.** Hero, positioning, current status (Wharton + RTX), contact links.

**`/projects` — the technical core.** Ordered by strength:
1. **Cottention** — novel linear attention replacing softmax with cosine similarity;
   custom CUDA/Triton kernels, 20-node DGX A100 SuperPOD, PB-scale SLURM pipeline.
   Published, Best Paper. *Strongest credential on the site; gets top billing.*
2. **ATLAS** — 12B LLM in air-gapped Kubernetes, 100+ agent tools across Jira,
   Confluence, PostgreSQL, Loki, Prometheus. Built in under 2 months.
3. **Document Intelligence (OCR → VLM)** — Tesseract LSTM bottleneck diagnosis →
   CRNN prototype → production PyTorch VLM pipeline. ~10x throughput, ~25% accuracy.
4. **Infrastructure at RTX** — AWS migration across 10+ classified enclaves, EKS with
   GPU autoscaling, Grafana/Prometheus.

**`/experience`** — RTX, SMU Research (Dr. Eric Larson), Croquet ($2.7MM seed raise).

**`/blog`** — scaffolded, empty, hidden from nav until a first post exists.

The two orphaned store projects (Image Feature Extraction; Audio FFT/Doppler) are
Sep 2023 coursework, well below the bar set by the above. **Recommend cutting** —
confirm if you'd rather keep them.

### Open questions

1. **Phone number — recommend omitting.** Both resumes carry `(310) 433-6570`. A
   public page is very different from a resume you hand out; scrapers will find it.
   **Default: omit unless you say otherwise.** Email is the normal contact channel.
2. **Email:** publish `trevordohm@gmail.com`? Standard practice, low risk, but your call.
3. **Clearance:** both resumes list Active TS/SCI + Polygraph. Common on LinkedIn, so
   not unusual — but it is a deliberate choice on a personal site. Include or omit?
4. **GitHub profile** — not on either resume. Link it? Are any projects public?
5. **RTX detail level.** Everything here is already on a resume you circulate, so
   presumably cleared. Confirm the classified-adjacent work (enclaves, air-gapped
   deployments) is fine to state publicly in the same words.

**Default if unanswered:** phone omitted; everything else carried over verbatim from
the resumes, since that copy is already in circulation.

## 5. Migration approach

Build Astro alongside the existing code on a branch; delete the old Vite app only
once the new site renders correctly. The current site stays live and untouched
throughout — the `gh-pages` branch is not touched until the new build is verified.

Rollback is `git revert` plus one redeploy.

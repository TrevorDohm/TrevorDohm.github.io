# trevordohm.github.io

Personal site: [trevordohm.github.io](https://trevordohm.github.io)

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com).
Static output, **zero client-side JavaScript**.

## Development

Node version is pinned in `.node-version` (22). With [fnm](https://github.com/Schniz/fnm)
installed, `cd` into the repo and it switches automatically.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-check + build to dist/
npm run preview  # serve the production build locally
```

## Deployment

Pushing to `master` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds and publishes to GitHub Pages. The repo's Pages source must be set to
**GitHub Actions** (Settings → Pages), not a branch.

## Structure

```
src/
  data/          content. Edit these, not the markup.
    site.ts        name, links, privacy toggles
    projects.ts    project entries
    experience.ts  roles, education, skills
  layouts/       BaseLayout.astro: <head>, metadata, chrome
  components/    Nav, Footer, ProjectCard
  pages/         index, projects, experience (file-based routing)
  styles/        global.css: Tailwind v4 theme tokens
```

Content lives in `src/data/`. Adding a project means appending to `projects.ts`;
no markup changes needed.

`src/data/site.ts` holds privacy toggles (`showPhone`, `showEmail`, `showClearance`)
that control what appears in the contact section.

## Notes

- Tailwind v4 is configured CSS-first via `@theme` in `src/styles/global.css`.
  There is no `tailwind.config.ts`.
- The previous Vite + React SPA is preserved under `legacy/` during the migration
  and should be deleted once this version is live.

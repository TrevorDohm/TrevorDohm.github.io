// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// Deployed to GitHub Pages as a *user* site (TrevorDohm.github.io), so the
// site is served from the domain root and needs no `base` path.
export default defineConfig({
  site: 'https://trevordohm.github.io',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})

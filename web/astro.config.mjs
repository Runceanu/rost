import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { fileURLToPath } from 'node:url'

// The site lives in web/, but its content is the rest of the repo: contracts,
// tokens, components, docs. Vite needs to be allowed to read up there.
const repo = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  site: 'https://rost.build',
  outDir: './dist',
  integrations: [react()],
  build: { format: 'directory' },
  // Where the repo is, for code that reads its files at build time. Astro
  // bundles pages into dist/chunks/, so paths relative to a module break.
  vite: { server: { fs: { allow: [repo] } }, define: { __REPO__: JSON.stringify(repo) }, build: { assetsInlineLimit: 0 } },
})

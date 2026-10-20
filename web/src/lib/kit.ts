// The site reads the same model the doc builders use, so the website and the
// markdown docs can't disagree about what a component is.
import { readFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { marked } from 'marked'

declare const __REPO__: string
const repo = pathToFileURL(__REPO__)
// Loaded from where it lives, not bundled: it reads the repo relative to itself.
const lib = await import(/* @vite-ignore */ new URL('bin/lib/kit.mjs', repo).href)
const { loadKit, KINDS, APP_LABEL, title, sourceLink, guidanceMarkdown, classify } = lib
export { KINDS, APP_LABEL, title, sourceLink, classify }

export const kit: any[] = loadKit()
export const byId = (id: string) => kit.find((e) => e.id === id)
export const inCode = (id: string) => existsSync(new URL(`src/components/${id}/`, repo))
export const built = kit.filter((e) => inCode(e.id))

export const md = (src: string) => marked.parse(src, { async: false }) as string
export const guidanceHtml = (g: any) => (g ? md(guidanceMarkdown(g)) : '')
export const readRepo = (path: string) => readFileSync(new URL(path, repo), 'utf8')

export const tokens: Record<string, { cssVar: string; value: string }> = JSON.parse(readRepo('tokens/tokens.json')).tokens

/** The React component file for a built component, e.g. src/components/badge/Badge.tsx. */
export function componentSource(id: string) {
  const name = title(byId(id)).replace(/\s+/g, '')
  const file = `src/components/${id}/${name}.tsx`
  return existsSync(new URL(file, repo)) ? { file, code: readRepo(file) } : null
}

export const GITHUB = 'https://github.com/Runceanu/rost'

// Figma sometimes hands back an empty, fully transparent render (it did for
// all of Button on 2026-10-19). Those don't belong on a page.
import { PNG } from 'pngjs'
export function blankShot(path: string) {
  const p = PNG.sync.read(readFileSync(new URL(path, repo)))
  let lit = 0
  for (let i = 3; i < p.data.length; i += 4) if (p.data[i] > 8 && ++lit > 4) return false
  return true
}

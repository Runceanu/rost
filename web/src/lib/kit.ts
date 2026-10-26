// The site reads the same model the doc builders use, so the website and the
// markdown docs can't disagree about what a component is.
import { readFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { marked } from 'marked'
import { PNG } from 'pngjs'

declare const __REPO__: string
const repo = pathToFileURL(__REPO__)
// Loaded from where it lives, not bundled: it reads the repo relative to itself.
const lib = await import(/* @vite-ignore */ new URL('bin/lib/kit.mjs', repo).href)
const { loadKit, KINDS, APP_LABEL, title, sourceLink, guidanceMarkdown, tokenCell, isColour } = lib
export { APP_LABEL, title, sourceLink, tokenCell, isColour }

export const kit: any[] = loadKit()
export const byId = (id: string) => kit.find((e) => e.id === id)
// A component has its folder; an effect is a token, in code once its preview exists.
export const inCode = (id: string) => existsSync(new URL(`src/components/${id}/`, repo)) || existsSync(new URL(`src/effects/${id}.fixtures.tsx`, repo))
export const built = kit.filter((e) => inCode(e.id))
/** The contracts shown on another's page (a tab-item under tabs). */
export const partsOf = (id: string) => kit.filter((e) => e.c.partOf === id)
/** Components, patterns and effects, each with its entries, leaving out a kind that has none and the parts, which live on their whole's page. */
export const groups: [string, string, any[]][] = KINDS
  .map(([k, label]: [string, string]) => [k, label, kit.filter((e) => e.kind === k && !e.c.partOf)])
  .filter(([, , list]: [string, string, any[]]) => list.length)

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
export function blankShot(path: string) {
  const p = PNG.sync.read(readFileSync(new URL(path, repo)))
  let lit = 0
  for (let i = 3; i < p.data.length; i += 4) if (p.data[i] > 8 && ++lit > 4) return false
  return true
}

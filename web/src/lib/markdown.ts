// The site's pages as markdown, for agents and anyone who'd rather read plain
// text: the same files that live in the repo, with their links made absolute.
import { readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { readRepo, GITHUB } from './kit'
import { DOCS } from './docs'

declare const __REPO__: string
const SITE = 'https://rost.build'
const docBySlug = Object.fromEntries(Object.entries(DOCS).map(([slug, d]) => [d.file, slug]))

/** Turns the repo-relative links in a markdown file at `from` into full URLs. */
function absolute(src: string, from: string) {
  return src.replace(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g, (_, href: string) => {
    const [path, hash = ''] = href.split('#')
    const anchor = hash && `#${hash}`
    const file = new URL(path, `file:///${from}`).pathname.slice(1)
    const comp = file.match(/^docs\/components\/([\w-]+)\.md$/)
    if (comp) return `](${SITE}/components/${comp[1]}.md${anchor})`
    if (docBySlug[file]) return `](${SITE}/docs/${docBySlug[file]}.md${anchor})`
    if (file === 'docs/README.md' || file === 'README.md') return `](${SITE}/llms.txt)`
    return `](${GITHUB}/blob/master/${file}${anchor})`
  })
}
const clean = (src: string) => src.replace(/^<!--[\s\S]*?-->\s*/, '')

export const componentDocIds = readdirSync(new URL('docs/components/', pathToFileURL(__REPO__))).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort()
export const componentMarkdown = (id: string) => absolute(clean(readRepo(`docs/components/${id}.md`)), `docs/components/${id}.md`)
export const docMarkdown = (slug: keyof typeof DOCS) => absolute(clean(readRepo(DOCS[slug].file)), DOCS[slug].file)
export const markdown = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })

// /llms.txt: what Rost is and where everything is, in the shape llmstxt.org
// suggests, so an agent can find a component's contract without the HTML.
import type { APIRoute } from 'astro'
import { kit, title, inCode } from '../lib/kit'
import { DOCS } from '../lib/docs'
import { componentDocIds } from '../lib/markdown'
import { registryIds } from '../lib/registry'

const SITE = 'https://rost.build'
const line = (s: unknown) => String(s ?? '').trim().replace(/\s+/g, ' ')

export const GET: APIRoute = () => {
  const entries = kit.filter((e: any) => componentDocIds.includes(e.id))
  const text = [
    '# Rost',
    '',
    '> A design system that started for my own needs and grew into a product of its own. Every component has a contract (YAML) that says what it is, every value it takes and when to use it. The tokens and the React components are built from those contracts.',
    '',
    `Components are copied into an app, not imported from a package. Each one that's in code is a registry item at ${SITE}/r/<id>.json, in shadcn's format: \`npx shadcn add ${SITE}/r/button.json\`. They're React with plain CSS, and need src/rost/fonts.css and src/rost/tokens.css imported once. The contracts are the source of truth: when the code and a contract disagree, the contract wins.`,
    '',
    '## Docs',
    '',
    ...Object.entries(DOCS).map(([slug, d]) => `- [${d.title}](${SITE}/docs/${slug}.md)`),
    '',
    '## Components',
    '',
    ...entries.map((e: any) => `- [${title(e)}](${SITE}/components/${e.id}.md): ${line(e.c.summary)}${registryIds.includes(e.id) ? ` Install: ${SITE}/r/${e.id}.json` : inCode(e.id) ? '' : ' Not in code yet.'}`),
    '',
    '## Optional',
    '',
    `- [Registry index](${SITE}/r/registry.json): every installable item and its files`,
    `- [Tokens](${SITE}/r/rost.json): tokens.css, fonts.css and conform.ts as a registry item`,
    '- [Source](https://github.com/Runceanu/rost): contracts in contracts/, tokens in tokens/, components in src/components/',
    '',
  ].join('\n')
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

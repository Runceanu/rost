/**
 * Loads the kit as one model: each YAML contract plus what is derived from it —
 * the apps that implement it, every token it asserts, and which of those fail
 * to resolve in tokens.css.
 *
 * Both doc outputs read from here, so the markdown pages and reference.html
 * cannot disagree about what a component is.
 */
import { readFileSync } from 'node:fs'
import { read, ids } from './contract-io.mjs'

/** `{ state: Hover, selected: true }` -> `state=Hover, selected=True`, as in Figma. */
export const variantKey = (when) =>
  Object.entries(when).map(([k, v]) => `${k}=${v === true ? 'True' : v === false ? 'False' : v}`).join(', ')

/** Every token path the contract asserts, with the value it resolves to. */
function tokensOf(c) {
  const out = new Map()
  const add = (styles) => { for (const v of Object.values(styles ?? {})) if (v.token && !out.has(v.token)) out.set(v.token, v.value) }
  for (const e of Object.values(c.elements ?? {})) add(e.styles)
  for (const v of c.variants ?? []) for (const s of Object.values(v.elements ?? {})) add(s)
  return out
}

export function loadKit() {
  // tokens.json keys were derived from CSS names, so `non-interactive` became
  // `non/interactive`. Compare on the CSS variable, which is unambiguous.
  const cssVars = new Set(Object.values(JSON.parse(readFileSync(new URL('../../tokens/tokens.json', import.meta.url), 'utf8')).tokens).map((t) => t.cssVar))
  const resolves = (path) => cssVars.has('--' + path.replace(/\//g, '-'))

  return ids().map((id) => {
    const c = read(id)
    const implementations = Object.entries(c.implementations ?? {}).map(([app, i]) => ({ app, ...i }))
    const tokens = tokensOf(c)
    const values = valuesOf(c)
    const coverage = Object.fromEntries(COVERAGE.map(([k]) => [k, 0]))
    for (const { prop, v } of values) coverage[classify(prop, v)]++
    return {
      id,
      file: `${id}.contract.yaml`,
      c,
      kind: c.kind,
      guidance: c.guidance ?? null,
      implementations,
      deviations: [...(c.deviations ?? []), ...implementations.flatMap((i) => (i.deviations ?? []).map((d) => ({ ...d, app: i.app })))],
      // Views for tables: fixed styles by part, and variant differences keyed as Figma names them.
      invariants: Object.fromEntries(Object.entries(c.elements ?? {}).filter(([, el]) => el.styles).map(([p, el]) => [p, el.styles])),
      variantMap: Object.fromEntries((c.variants ?? []).filter((v) => v.elements).map((v) => [variantKey(v.when), v.elements])),
      tokens,
      unresolved: [...tokens.keys()].filter((t) => !resolves(t)),
      values,
      coverage,
      resolves,
    }
  }).sort((a, b) => a.c.name.localeCompare(b.c.name) || a.id.localeCompare(b.id))
}

/*
 * Why a value has (or lacks) a token. Layout keywords are how Figma builds the
 * layer — absolute icon unions, centring, clipping, which sides get a stroke —
 * and no design system tokenises them, so they are not gaps.
 */
const LAYOUT = new Set(['position', 'inset', 'border-sides', 'align-items', 'justify-content', 'overflow', 'background-attachment'])
export const COVERAGE = [
  ['token', 'Bound to a token'],
  ['suggested', 'Token suggested'],
  ['layout', 'Layout keyword'],
  ['sample', 'Figma frame size'],
  ['reasoned', 'Untokenised on purpose'],
  ['gap', 'Open gap'],
]
export function classify(prop, v) {
  if (v.token) return 'token'
  if (v.suggest) return 'suggested'
  if (LAYOUT.has(prop)) return 'layout'
  if (v.assert === false) return 'sample'
  if (v.untokenised) return 'reasoned'
  return 'gap'
}

/** Every value in a contract with where it sits: [part, prop, value, variant?]. */
export function valuesOf(c) {
  const out = []
  for (const [p, e] of Object.entries(c.elements ?? {})) for (const [k, v] of Object.entries(e.styles ?? {})) out.push({ part: p, prop: k, v })
  for (const x of c.variants ?? []) for (const [p, s] of Object.entries(x.elements ?? {})) for (const [k, v] of Object.entries(s)) out.push({ part: p, prop: k, v, variant: variantKey(x.when) })
  return out
}

export const KINDS = [['component', 'Components'], ['pattern', 'Patterns'], ['effect', 'Effects']]
export const APP_LABEL = { 'accounting-app': 'the accounting app', 'portfolio-site': 'the portfolio site' }

/** Display name: the Menu component and the Menu effect style share a Figma name. */
export const title = (e) => (e.kind === 'effect' ? `${e.c.name} effect` : e.c.name)

export const sourceLink = (c) =>
  c.source.tool === 'figma'
    ? { label: `Figma ${c.source.nodeId}`, href: c.source.url }
    : { label: `${c.source.repo}/${c.source.path}`, href: null }

/** The `guidance` block as markdown — the one rendering both outputs share. */
export function guidanceMarkdown(g) {
  if (!g) return ''
  const label = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
  const out = []
  if (g.use?.length) out.push('## When to use', '', ...g.use.map((x) => `- ${x}`), '')
  if (g.avoid?.length) out.push('## When not to use', '', ...g.avoid.map((x) => `- ${x}`), '')
  if (g.behaviour) out.push('## Behaviour', '', g.behaviour, '')
  if (g.accessibility) out.push('## Accessibility', '', ...Object.entries(g.accessibility).map(([k, v]) => `- **${label(k)}**: ${v}`), '')
  if (g.content) out.push('## Content', '', g.content, '')
  if (g.openQuestions?.length) out.push('## Open questions', '', ...g.openQuestions.map((x) => `- ${x}`), '')
  return out.join('\n').trim()
}

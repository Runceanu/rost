/**
 * The kit as one model: each YAML contract plus what follows from it (the apps
 * that build it, every token it uses, and which of those tokens.css lacks).
 *
 * The markdown docs and the web/ site both read from here, so they can't
 * disagree about what a component is. Helpers that more than one script
 * needs live here too, so there's one copy of each.
 */
import { readFileSync } from 'node:fs'
import { read, ids } from './contract-io.mjs'

// ── Tokens ──────────────────────────────────────────────────────────────────

/**
 * tokens.json lost its hyphens in the keys (`non-interactive` became
 * `non/interactive`), so tokens are matched on the CSS variable, which is
 * exact: `spacing/gap/small` is there when `--spacing-gap-small` is.
 */
export function loadTokens() {
  const tokens = JSON.parse(readFileSync(new URL('../../tokens/tokens.json', import.meta.url), 'utf8')).tokens
  const vars = new Set(Object.values(tokens).map((t) => t.cssVar))
  return { tokens, vars, resolves: (path) => vars.has('--' + path.replace(/\//g, '-')) }
}

/** A scale, value to token path, read from tokens.json: `scale('spacing-gap')` gives `{ '8px': 'spacing/gap/small', … }`. */
export function scale(prefix) {
  const out = {}
  for (const { cssVar, value } of Object.values(loadTokens().tokens))
    if (cssVar.startsWith(`--${prefix}-`) && !(value in out)) out[value] = `${prefix.replace(/-/g, '/')}/${cssVar.slice(prefix.length + 3)}`
  return out
}

export const isColour = (v) => /^(#[0-9a-f]{3,8}|rgba?\()/i.test(String(v).trim())

// ── States ──────────────────────────────────────────────────────────────────

/**
 * Figma's interaction states, in order, and the CSS that triggers each. Any
 * other value of `state` (Locked) is a content state the caller sets.
 * src/conform.ts keeps its own copy, since it can't import this file.
 */
export const STATE_PSEUDO = { Default: '', Hover: ':hover', Pressed: ':active', Focus: ':focus-visible', Disabled: ':is(:disabled, [aria-disabled="true"])' }
export const STATES = Object.keys(STATE_PSEUDO)

/** `{ state: Hover, selected: true }` -> `state=Hover, selected=True`, as in Figma. */
export const variantKey = (when) =>
  Object.entries(when).map(([k, v]) => `${k}=${v === true ? 'True' : v === false ? 'False' : v}`).join(', ')

// ── Values ──────────────────────────────────────────────────────────────────

/** Every value in a contract, with where it sits. */
export function valuesOf(c) {
  const out = []
  for (const [p, e] of Object.entries(c.elements ?? {})) for (const [k, v] of Object.entries(e.styles ?? {})) out.push({ part: p, prop: k, v })
  for (const x of c.variants ?? []) for (const [p, s] of Object.entries(x.elements ?? {})) for (const [k, v] of Object.entries(s)) out.push({ part: p, prop: k, v, variant: variantKey(x.when) })
  return out
}

/*
 * How Figma builds a layer: positioning, centring, clipping, flex layout,
 * which sides get a stroke. Nobody tokenises these, so they're never gaps.
 * Of these, build-contracts marks display, flex-*, white-space, align-self
 * and position: relative as not asserted; the rest the check still tests.
 */
const LAYOUT = new Set(['position', 'inset', 'border-sides', 'align-items', 'justify-content', 'overflow', 'background-attachment',
  'display', 'flex-direction', 'flex-shrink', 'flex', 'white-space', 'text-align', 'align-self', 'vertical-align'])

export const COVERAGE = [
  ['token', 'Has a token'],
  ['suggested', 'Token suggested'],
  ['layout', 'How Figma builds it'],
  ['sample', 'Figma frame size'],
  ['reasoned', 'No token, on purpose'],
  ['gap', 'Open gap'],
]

/** Why a value has a token, or doesn't. */
export function classify(prop, v) {
  if (v.token) return 'token'
  if (v.suggest) return 'suggested'
  if (LAYOUT.has(prop) || (/^(width|height)$/.test(prop) && v.value === '100%')) return 'layout'
  if (v.assert === false) return 'sample'
  if (v.untokenised) return 'reasoned'
  return 'gap'
}

/** What the token column says for a value, the same on every page. */
export function tokenCell(prop, v) {
  const kind = classify(prop, v)
  if (kind === 'token') return { kind, text: v.token }
  if (kind === 'suggested') return { kind, text: `suggest ${v.suggest}` }
  if (kind === 'layout') return { kind, text: 'layout' }
  if (kind === 'sample') return { kind, text: 'Figma frame size' }
  if (kind === 'reasoned') return { kind, text: `on purpose: ${v.untokenised}` }
  return { kind, text: 'no token yet' }
}

// ── The kit ─────────────────────────────────────────────────────────────────

export function loadKit() {
  const { resolves } = loadTokens()
  return ids().map((id) => {
    const c = read(id)
    const implementations = Object.entries(c.implementations ?? {}).map(([app, i]) => ({ app, ...i }))
    const values = valuesOf(c)
    const tokens = new Map()
    for (const { v } of values) if (v.token && !tokens.has(v.token)) tokens.set(v.token, v.value)
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

export const KINDS = [['component', 'Components'], ['pattern', 'Patterns'], ['effect', 'Effects']]
// The app ids are also listed in the schema (implementations.propertyNames). Keep both in step.
export const APP_LABEL = { 'accounting-app': 'the accounting app', 'portfolio-site': 'the portfolio site' }

/** Display name: the Menu component and the Menu effect style share a Figma name. */
export const title = (e) => (e.kind === 'effect' ? `${e.c.name} effect` : e.c.name)

export const sourceLink = (c) =>
  c.source.tool === 'figma'
    ? { label: `Figma ${c.source.nodeId}`, href: c.source.url }
    : { label: `${c.source.repo}/${c.source.path}`, href: null }

/** The `guidance` block as markdown, the one rendering every output shares. */
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

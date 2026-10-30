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
 * tokens.json is keyed on the Figma names, but a contract's token path is
 * matched on the CSS variable, the name code actually uses:
 * `spacing/gap/small` is there when `--spacing-gap-small` is.
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

// ── Variants ────────────────────────────────────────────────────────────────

/** Every condition of `a` is one of `b`'s too. */
const within = (a, b) => Object.entries(a).every(([k, v]) => b[k] === v)

/**
 * The variants with their layers applied (docs/CONTRACT.md, "Variants as
 * layers"). An entry whose `when` sits inside another entry's is a layer:
 * it isn't a variant of its own, its values go into every variant it sits
 * inside. Each variant gets its matching entries from the least specific to
 * the most, and between two as specific, the later one wins.
 * src/conform.ts keeps its own copy, since it can't import this file.
 */
export function variantsOf(c) {
  const all = c.variants ?? []
  const size = (x) => Object.keys(x.when).length
  const isLayer = (x) => all.some((y) => size(y) > size(x) && within(x.when, y.when))
  return all.filter((x) => !isLayer(x)).map((v) => {
    const elements = {}
    const on = all.map((x, i) => [x, i]).filter(([x]) => within(x.when, v.when)).sort(([a, i], [b, j]) => size(a) - size(b) || i - j)
    for (const [x] of on) for (const [p, s] of Object.entries(x.elements ?? {})) elements[p] = { ...elements[p], ...s }
    return { ...v, ...(Object.keys(elements).length ? { elements } : {}) }
  })
}

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

/**
 * The values with no token on purpose, sorted by why. Most reasons repeat:
 * the same inset stroke in five states, the same focus ring in eleven
 * components. Each group says its reason once.
 */
export const PLAIN_KINDS = [
  ['stroke', 'Strokes drawn inside', 'Figma draws a stroke inside the shape. A CSS border takes up space, so the button would come out 1px wider. These are an inset `box-shadow` instead. The width and the colour are tokens, only the shadow around them isn\'t.'],
  ['ring', 'Focus rings', 'The ring sits `spacing/gap/2xsmall` outside the element, so its inset is that token turned negative. On a rounded element the ring\'s radius grows by the same gap, so the two curves stay parallel.'],
  ['mix', 'Colours at an opacity', 'A colour token at an opacity token. A token can\'t hold both, so `color-mix()` puts them together where they\'re used.'],
  ['icon', 'Icon files', 'An icon is its SVG file, drawn as a mask so it takes the text colour. The file is the value.'],
  ['size', 'Sizes with no token', 'Sizes and offsets that belong to one component, at a number no size token has.'],
  ['tuning', 'Tuned by eye', 'The paper effect\'s numbers, tuned for how the dots move. Only the paper uses them, and there are no motion tokens yet.'],
]

const plainKind = (e, { part, prop, v }) => {
  if (e.kind === 'effect') return 'tuning'
  if (part === 'focus-ring') return 'ring'
  if (prop === 'box-shadow' && String(v.value).startsWith('inset')) return 'stroke'
  if (prop === 'mask') return 'icon'
  if (/color-mix|gradient/.test(v.value)) return 'mix'
  return 'size'
}

/** Each kind with its entries, one per component, part and property, however many variants repeat it. */
export function plainGroups(kit) {
  const groups = new Map(PLAIN_KINDS.map(([k, label, why]) => [k, { kind: k, label, why, entries: new Map() }]))
  for (const e of kit) for (const x of e.values) {
    if (!x.v.untokenised) continue
    const key = `${e.id} ${x.part} ${x.prop}`
    const entries = groups.get(plainKind(e, x)).entries
    const entry = entries.get(key) ?? entries.set(key, { e, part: x.part, prop: x.prop, values: [], why: x.v.untokenised }).get(key)
    if (!entry.values.includes(x.v.value)) entry.values.push(x.v.value)
  }
  return [...groups.values()].map((g) => ({ ...g, entries: [...g.entries.values()] })).filter((g) => g.entries.length)
    .map((g) => ({ ...g, notes: g.kind === 'size' || g.kind === 'tuning', rows: plainRows(g) }))
}

// One row per value, with every component that uses it. Sizes and tuning keep each value's own note.
function plainRows(g) {
  const notes = g.kind === 'size' || g.kind === 'tuning'
  const rows = new Map()
  for (const x of g.entries) {
    const key = `${x.part}.${x.prop} ${[...x.values].sort().join(' ')}${notes ? x.why : ''}`
    const row = rows.get(key) ?? rows.set(key, { part: x.part, prop: x.prop, values: x.values, why: x.why, where: [] }).get(key)
    row.where.push(x.e)
  }
  return [...rows.values()]
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
      // The variants with their layers applied; a layer isn't one.
      variants: variantsOf(c),
      variantMap: Object.fromEntries(variantsOf(c).filter((v) => v.elements).map((v) => [variantKey(v.when), v.elements])),
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
export const APP_LABEL = { 'accounting-app': 'Accounting app', 'portfolio-site': 'Portfolio site' }

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
  if (g.use?.length) out.push('## When to use', '', ...g.use.map((x) => `- **${x.title}.** ${x.text}`), '')
  if (g.avoid?.length) out.push('## When not to use', '', ...g.avoid.map((x) => `- **${x.title}.** ${x.text}`), '')
  if (g.behaviour) out.push('## Behaviour', '', g.behaviour, '')
  if (g.accessibility) out.push('## Accessibility', '', ...Object.entries(g.accessibility).map(([k, v]) => `- **${label(k)}**: ${v}`), '')
  if (g.content) out.push('## Content', '', g.content, '')
  if (g.openQuestions?.length) out.push('## Open questions', '', ...g.openQuestions.map((x) => `- ${x}`), '')
  return out.join('\n').trim()
}

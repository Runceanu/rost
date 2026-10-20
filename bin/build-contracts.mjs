#!/usr/bin/env node
/**
 * Turns parsed Figma reads (raw/parsed.json) into contracts.
 *
 * A value that holds in every variant goes in `elements`; anything else is
 * written per variant. Getting that split right is the useful part: it says
 * out loud which values the design means to keep fixed, so a change to one
 * reads as a change to the component, not to one state.
 *
 * Every contract was frozen on 2026-10-20, so this skips them all. Pass
 * --unfreeze to read one from Figma again on purpose; the values come back
 * from Figma, while everything written by hand is kept (see `keep`).
 *
 *   node bin/build-contracts.mjs [--unfreeze]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { read, write, CONTRACTS, SCHEMA_VERSION } from './lib/contract-io.mjs'
import { STATES, scale } from './lib/kit.mjs'

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const parsed = json('../raw/parsed.json')
const { fileKey } = json('../registry/figma-inventory.json')
// The one list of components: every Figma set with a name in the registry.
const COMPONENTS = Object.fromEntries(Object.entries(json('../registry/component-sets.json')).filter(([, v]) => v.name).map(([id, v]) => [id, v]))
const FILE = 'UI-Kit-v01'
const url = (n) => `https://www.figma.com/design/${fileKey}/${FILE}?node-id=${String(n).replace(':', '-')}`
const same = (a, b) => a?.value === b?.value && (a?.token ?? null) === (b?.token ?? null)

// The scales a plain number gets matched against, straight from tokens.json.
const SIZES = scale('spacing-size')
const GAPS = scale('spacing-gap')
const OUTLINES = scale('spacing-outline')
const NOT_ASSERTED = ['display', 'flex-direction', 'flex-shrink', 'flex', 'white-space', 'align-self']

/** When a component was really read: the newest of its raw files, in local time. */
function readOn(id) {
  const dir = new URL('../raw/variants/', import.meta.url)
  const times = readdirSync(dir).filter((f) => f.startsWith(`${id}__`)).map((f) => statSync(new URL(f, dir)).mtime)
  if (!times.length) return undefined
  const d = new Date(Math.max(...times))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** What a value means, beyond the number Figma gave. */
function annotate(part, prop, val) {
  // Layout the box needs, written down so code can be generated from it, but
  // nothing to fail an app over: an app can reach the same layout other ways.
  if (NOT_ASSERTED.includes(prop) || (prop === 'position' && val.value === 'relative')) return { ...val, assert: false }
  const isSize = prop === 'width' || prop === 'height'
  if (!val.token && isSize && SIZES[val.value]) {
    // A fixed size right on the scale is a decision, root or not: Badge's
    // small dot is 24x24, icon frames are 16 or 20, avatars 56.
    return { ...val, suggest: SIZES[val.value] }
  }
  if (!val.token && isSize && part === 'root') {
    // Any other root size is how big the Figma frame was, not a spec. Input's
    // root is h-[var(--spacing/size/large)] and w-[208px]: the height is
    // meant, the width was the sample's.
    return { ...val, assert: false, notes: 'Just the size of the Figma frame. No token, and not something to copy.' }
  }
  // An `outline` part drawn as a 1 or 2px rectangle is a stroke on the outline scale.
  if (!val.token && part === 'outline' && prop === 'height' && OUTLINES[val.value]) return { ...val, suggest: OUTLINES[val.value] }
  // A focus ring's radius is the element's radius plus the ring's offset.
  if (!val.token && part === 'focus-ring' && prop === 'border-radius') return { ...val, untokenised: "The element's radius plus the ring's offset, so it follows from those two." }
  // A plain gap or padding on the scale, like Input's `gap-[8px]` where every
  // other gap in the kit uses spacing/gap/small.
  if (!val.token && (prop === 'gap' || prop.startsWith('padding')) && GAPS[val.value]) return { ...val, suggest: GAPS[val.value] }
  return val
}

/**
 * Keep what was decided by hand on a value Figma still agrees with: an
 * accepted token, a note, a reason it has no token.
 */
function keep(next, prev) {
  if (!prev || prev.value !== next.value) return next
  const out = { ...next }
  if (prev.token && (!next.token || next.suggest === prev.token)) { out.token = prev.token; delete out.suggest }
  if (prev.notes) out.notes = prev.notes
  if (prev.untokenised && !out.token) out.untokenised = prev.untokenised
  return out
}
const keepAll = (next, prev) => Object.fromEntries(Object.entries(next).map(([prop, v]) => [prop, keep(v, prev?.[prop])]))

for (const [id, variants] of Object.entries(parsed)) {
  // Only named component sets get a contract. Icons and illustrations are assets.
  const set = COMPONENTS[id]
  if (!set) continue

  const prev = existsSync(new URL(`${id}.contract.yaml`, CONTRACTS)) ? read(id) : {}
  // A frozen contract is the source now. Re-reading Figma would undo every
  // decision taken in it since the freeze, so that only happens on purpose.
  if (prev.source?.frozenAt && !process.argv.includes('--unfreeze')) {
    console.log(`  ${set.name.padEnd(18)} frozen ${prev.source.frozenAt}, skipped`)
    continue
  }

  const seen = new Map()
  for (const v of variants)
    for (const [part, props] of Object.entries(v.values))
      for (const [prop, val] of Object.entries(props)) {
        const k = `${part} ${prop}`
        if (!seen.has(k)) seen.set(k, [])
        seen.get(k).push({ variant: v.variant, val })
      }

  const invariants = {}
  const perVariant = {}
  for (const [k, entries] of seen) {
    const [part, prop] = [k.slice(0, k.indexOf(' ')), k.slice(k.indexOf(' ') + 1)]
    const constant = entries.length === variants.length && entries.every((e) => same(e.val, entries[0].val))
    if (constant) (invariants[part] ??= {})[prop] = annotate(part, prop, entries[0].val)
    else for (const e of entries) ((perVariant[e.variant] ??= {})[part] ??= {})[prop] = annotate(part, prop, e.val)
  }

  const axes = {}
  for (const v of variants)
    for (const pair of (v.variant || '').split(',').map((s) => s.trim()))
      if (pair.includes('=')) { const [a, val] = pair.split('='); (axes[a] ??= new Set()).add(val) }

  // `state` isn't a prop: code reaches it through pseudo-classes. A False/True axis is a boolean.
  const booleans = new Set(Object.entries(axes).filter(([, v]) => v.size === 2 && v.has('True') && v.has('False')).map(([a]) => a))
  const props = Object.fromEntries(Object.entries(axes).filter(([a]) => a !== 'state').map(([a, vals]) => {
    if (booleans.has(a)) return [a, { type: 'boolean', default: false }]
    const sorted = [...vals].sort()
    return [a, { type: 'enum', values: sorted, default: sorted[0] }]
  }))
  for (const [k, p] of Object.entries(props)) if (prev.props?.[k]?.notes) p.notes = prev.props[k].notes
  // Props that aren't variant axes (showIcon, a slot) are Figma component
  // properties the read doesn't see. They're written by hand, and kept.
  for (const [k, p] of Object.entries(prev.props ?? {})) if (!props[k] && !(k in axes)) props[k] = p
  const when = (name) => Object.fromEntries(name.split(',').map((p) => p.trim().split('=')).map(([k, v]) => [k, booleans.has(k) ? v === 'True' : v]))

  const parts = [...new Set(variants.flatMap((v) => Object.keys(v.values)))]
  const elements = Object.fromEntries(parts.map((p) => {
    const { styles: before, ...authored } = prev.elements?.[p] ?? {}
    // A part that only shows up when a show* switch is on is optional.
    const optional = variants.every((v) => !v.values[p] || v.optional?.includes(p))
    return [p, { ...authored, ...(optional ? { optional: true } : {}), ...(invariants[p] ? { styles: keepAll(invariants[p], before) } : {}) }]
  }))
  const prevVariant = (name) => prev.variants?.find((x) => Object.entries(when(name)).every(([k, v]) => x.when?.[k] === v))

  write({
    ...prev,
    schemaVersion: SCHEMA_VERSION,
    id,
    name: set.name,
    kind: 'component',
    status: prev.status ?? 'review',
    // A re-read makes Figma the source again; freeze it again when it's settled.
    source: { tool: 'figma', fileKey, nodeId: set.setNodeId, url: url(set.setNodeId), extractedAt: readOn(id), extractedBy: 'mcp' },
    props: Object.keys(props).length ? props : undefined,
    // Interaction states first, in a fixed order; content states (Locked) after, as Figma lists them.
    states: axes.state ? [...STATES.filter((s) => axes.state.has(s)), ...[...axes.state].filter((s) => !STATES.includes(s))] : undefined,
    elements,
    // A lone symbol with no properties (Divider) has no variants, only elements.
    variants: Object.keys(axes).length
      ? variants.map((v) => {
        const before = prevVariant(v.variant)?.elements
        const diff = perVariant[v.variant] && Object.fromEntries(Object.entries(perVariant[v.variant]).map(([p, s]) => [p, keepAll(s, before?.[p])]))
        return { when: when(v.variant), figmaNode: v.nodeId, ...(diff ? { elements: diff } : {}) }
      })
      : undefined,
  })
  const nInv = Object.values(invariants).reduce((s, o) => s + Object.keys(o).length, 0)
  const nVar = Object.values(perVariant).reduce((s, o) => s + Object.values(o).reduce((t, x) => t + Object.keys(x).length, 0), 0)
  console.log(`  ${set.name.padEnd(18)}${String(variants.length).padStart(3)} variants  ${String(nInv).padStart(2)} fixed  ${String(nVar).padStart(3)} per variant  ${parts.length} parts`)
}

#!/usr/bin/env node
/**
 * Splits parsed variants into invariants and per-variant differences.
 *
 * A value holding across EVERY variant is an invariant; anything else is keyed
 * by variant. Getting this split right is the useful part: it says out loud
 * which properties the design intends to stay fixed, so a change to one reads
 * as a change to the component rather than to a single state.
 */
import { readFileSync, existsSync } from 'node:fs'
import { read, write, CONTRACTS, SCHEMA_VERSION } from './lib/contract-io.mjs'

const parsed = JSON.parse(readFileSync(new URL('../raw/parsed.json', import.meta.url), 'utf8'))
const inv = JSON.parse(readFileSync(new URL('../registry/figma-inventory.json', import.meta.url), 'utf8'))
const sets = { badge: '139:395', 'pill-button': '20:14', button: '39:38', 'icon-button': '93:587',
  input: '240:273', toggle: '168:1149', 'inline-banner': '205:614', chips: '139:317',
  tags: '91:362', menu: '41:259', carousel: '157:302', projects: '100:185', thumbs: '109:79',
  testimonials: '144:67', 'testimonials-pics': '144:493', divider: '39:111' }
const NAMES = { badge: 'Badge', 'pill-button': 'PillButton', button: 'Button', 'icon-button': 'IconButton',
  input: 'Input', toggle: 'Toggle', 'inline-banner': 'InlineBanner', chips: 'Chip', tags: 'Tag', menu: 'Menu',
  carousel: 'Carousel', projects: 'Projects', thumbs: 'Thumbs', testimonials: 'Testimonials',
  'testimonials-pics': 'TestimonialPicture', divider: 'Divider' }
const FK = inv.fileKey
const url = (n) => `https://www.figma.com/design/${FK}/UI-Kit-v01?node-id=${String(n).replace(':', '-')}`
const same = (a, b) => a?.value === b?.value && (a?.token ?? null) === (b?.token ?? null)

for (const [comp, variants] of Object.entries(parsed)) {
  const seen = new Map()
  for (const v of variants) {
    for (const [part, props] of Object.entries(v.values)) {
      for (const [prop, val] of Object.entries(props)) {
        const k = part + ' ' + prop
        if (!seen.has(k)) seen.set(k, [])
        seen.get(k).push({ variant: v.variant, val })
      }
    }
  }

  /*
   * A root width or height with no token behind it is the frame's size in
   * Figma, not a specification. Input's root carries h-[var(--spacing/size/
   * large,56px)] AND w-[208px]: the height is a decision, the width is how wide
   * the sample happened to be. Both are recorded; only the tokenised one is
   * asserted, so conformance stops reporting a component as wrong for not
   * hardcoding a canvas measurement.
   */
  /*
   * Icon frames are sized with literals (`size-[20px]`) although the size scale
   * holds exactly those values. The value is a real decision; it is only the
   * binding that is missing, so suggest the scale step rather than leave it
   * reading as a gap. `token` stays what Figma actually binds.
   */
  const OUTLINES = { '1px': 'spacing/outline/small', '2px': 'spacing/outline/medium' }
  const GAPS = { '2px': 'spacing/gap/3xsmall', '4px': 'spacing/gap/2xsmall', '6px': 'spacing/gap/xsmall',
    '8px': 'spacing/gap/small', '12px': 'spacing/gap/small-medium', '16px': 'spacing/gap/medium',
    '20px': 'spacing/gap/medium-large', '24px': 'spacing/gap/large', '32px': 'spacing/gap/xlarge',
    '40px': 'spacing/gap/2xlarge', '48px': 'spacing/gap/3xlarge', '56px': 'spacing/gap/4xlarge', '64px': 'spacing/gap/5xlarge' }
  const SIZES = { '12px': 'spacing/size/3xsmall', '16px': 'spacing/size/2xsmall', '20px': 'spacing/size/xsmall',
    '24px': 'spacing/size/small', '32px': 'spacing/size/small-medium', '40px': 'spacing/size/medium',
    '48px': 'spacing/size/medium-large', '56px': 'spacing/size/large', '64px': 'spacing/size/xlarge' }
  const markSamples = (part, prop, val) => {
    if (part === 'root' && (prop === 'width' || prop === 'height') && !val.token)
      return { ...val, assert: false, notes: 'No token behind it — the Figma frame size, not a spec.' }
    // Any part below the root sized on the scale: icon frames, action slots, avatars.
    if (part !== 'root' && (prop === 'width' || prop === 'height') && !val.token && SIZES[val.value])
      return { ...val, suggest: SIZES[val.value] }
    // An `outline` part drawn as a 1-2px rectangle is a stroke on the outline scale.
    if (part === 'outline' && prop === 'height' && !val.token && OUTLINES[val.value])
      return { ...val, suggest: OUTLINES[val.value] }
    // The focus ring's radius is the element's radius plus the ring's offset: derived, not a token.
    if (part === 'focus-ring' && prop === 'border-radius' && !val.token)
      return { ...val, untokenised: 'Derived: the element radius plus the focus ring offset.' }
    // Same for spacing: Input's leading group is `gap-[8px]` in all 14 variants
    // while every other gap in the kit binds spacing/gap/small.
    if ((prop === 'gap' || prop.startsWith('padding')) && !val.token && GAPS[val.value])
      return { ...val, suggest: GAPS[val.value] }
    return val
  }

  const invariants = {}
  const perVariant = {}
  for (const [k, entries] of seen) {
    const sp = k.indexOf(' ')
    const part = k.slice(0, sp)
    const prop = k.slice(sp + 1)
    const constant = entries.length === variants.length && entries.every((e) => same(e.val, entries[0].val))
    if (constant) {
      if (!invariants[part]) invariants[part] = {}
      invariants[part][prop] = markSamples(part, prop, entries[0].val)
    } else {
      for (const e of entries) {
        if (!perVariant[e.variant]) perVariant[e.variant] = {}
        if (!perVariant[e.variant][part]) perVariant[e.variant][part] = {}
        perVariant[e.variant][part][prop] = markSamples(part, prop, e.val)
      }
    }
  }

  const axes = {}
  for (const v of variants) {
    for (const pair of (v.variant || '').split(',').map((s) => s.trim())) {
      if (pair.includes('=')) {
        const [a, val] = pair.split('=')
        if (!axes[a]) axes[a] = new Set()
        axes[a].add(val)
      }
    }
  }

  /*
   * The `state` axis is not a prop: code reaches it through pseudo-classes, and
   * only Disabled is ever set by a caller. A False/True axis is a boolean.
   */
  const STATES = ['Default', 'Hover', 'Pressed', 'Focus', 'Disabled']
  const booleans = new Set(Object.entries(axes).filter(([, v]) => v.size === 2 && v.has('True') && v.has('False')).map(([a]) => a))
  const props = Object.fromEntries(Object.entries(axes).filter(([a]) => a !== 'state').map(([a, vals]) => {
    if (booleans.has(a)) return [a, { type: 'boolean', default: false }]
    const sorted = [...vals].sort()
    return [a, { type: 'enum', values: sorted, default: sorted[0] }]
  }))
  const when = (name) => Object.fromEntries(name.split(',').map((p) => p.trim().split('='))
    .map(([k, v]) => [k, booleans.has(k) ? v === 'True' : v]))

  /*
   * Only the extracted sections are rewritten. Everything authored — summary,
   * guidance, implementations, deviations, element notes, prop notes, status
   * once it has moved past review — survives a re-read of Figma untouched.
   */
  const id = comp
  const prev = existsSync(new URL(`${id}.contract.yaml`, CONTRACTS)) ? read(id) : {}
  // A frozen contract is the source now; Figma is history. Re-reading it would
  // quietly undo every decision taken in the contract since the freeze.
  if (prev.source?.frozenAt && !process.argv.includes('--unfreeze')) {
    console.log(`  ${(NAMES[comp] || comp).padEnd(13)} frozen ${prev.source.frozenAt}, skipped (pass --unfreeze to overwrite)`)
    continue
  }
  const parts = [...new Set(variants.flatMap((v) => Object.keys(v.values)))]
  const elements = Object.fromEntries(parts.map((p) => {
    const { styles: _, ...authored } = prev.elements?.[p] ?? {}
    return [p, { ...authored, ...(invariants[p] ? { styles: invariants[p] } : {}) }]
  }))
  for (const [k, p] of Object.entries(props)) if (prev.props?.[k]?.notes) p.notes = prev.props[k].notes

  write({
    ...prev,
    schemaVersion: SCHEMA_VERSION,
    id,
    name: NAMES[comp] || comp,
    kind: 'component',
    status: prev.status ?? 'review',
    source: { tool: 'figma', fileKey: FK, nodeId: sets[comp], url: url(sets[comp]),
      extractedAt: '2026-08-18', extractedBy: 'mcp' },
    props: Object.keys(props).length ? props : undefined,
    // Interaction states first, in a fixed order; content states (Locked) after, as Figma lists them.
    states: axes.state ? [...STATES.filter((s) => axes.state.has(s)), ...[...axes.state].filter((s) => !STATES.includes(s))] : undefined,
    elements,
    // A lone symbol with no properties (Divider) has no variants, only elements.
    variants: Object.keys(axes).length ? variants.map((v) => ({ when: when(v.variant), figmaNode: v.nodeId,
      ...(perVariant[v.variant] ? { elements: perVariant[v.variant] } : {}) })) : undefined,
  })
  const nInv = Object.values(invariants).reduce((s, o) => s + Object.keys(o).length, 0)
  const nVar = Object.values(perVariant).reduce((s, o) => s + Object.values(o).reduce((t, x) => t + Object.keys(x).length, 0), 0)
  console.log('  ' + (NAMES[comp] || comp).padEnd(13) + String(variants.length).padStart(3) + ' variants  ' +
    String(nInv).padStart(2) + ' invariants  ' + String(nVar).padStart(3) + ' variant values  ' + parts.length + ' parts')
}

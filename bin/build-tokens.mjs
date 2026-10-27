#!/usr/bin/env node
/**
 * Builds tokens/tokens.css and tokens/tokens.json from Figma's variables.
 *
 * registry/figma-variables.json holds every local variable in the UI Kit, read
 * once with use_figma on 2026-10-26. A few variables come from a library, not
 * the file itself (Base/Black), so they're taken from the saved
 * raw/*.get_variable_defs.txt reads. Then come Rost's own tokens, the ones
 * Figma has no variable for: the effects, the shadow, the hero height and two
 * old names the apps still use.
 *
 * Everything is keyed on the Figma name, so hyphens survive: the key is
 * `non-interactive/foreground/primary` and the CSS variable is
 * `--non-interactive-foreground-primary`. tokens.css is the dark theme, Rost's
 * default. tokens.json also carries each theme variable's light value and the
 * primitive it points at.
 *
 *   node bin/build-tokens.mjs           write tokens/
 *   node bin/build-tokens.mjs --check   exit 1 if tokens/ is out of date
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const check = process.argv.includes('--check')
const registry = JSON.parse(readFileSync(join(root, 'registry/figma-variables.json'), 'utf8'))

// The family's fallbacks. Figma only knows the variable font's name.
const FONT_FALLBACKS = ["'General Sans'", 'sans-serif']

// Rost's own tokens. Figma has no variable for any of these.
const ROST = [
  ['typography/subtitle/font-size', 'var(--typography-sub-title-font-size)', 'Old name for typography/sub-title/font-size. The accounting app and the portfolio site still use it.'],
  ['typography/subtitle/line-height', 'var(--typography-sub-title-line-height)', 'Old name for typography/sub-title/line-height.'],
  ['spacing/layout/hero-height', '630px', 'The case-study hero (Hero Media). Made in code on 2026-10-19.'],
  ['effect/thumb', 'blur(12px)', 'BACKGROUND_BLUR "Thumb": the frosted project-thumbnail panel.'],
  ['effect/menu', 'blur(12px)', 'BACKGROUND_BLUR "Menu": frosted glass, standard radius (nav, hero cards).'],
  ['effect/menu-lg', 'blur(24px)', '"Menu" frosted glass, large radius (case-study hero and island backgrounds).'],
  ['effect/lock-frame', 'blur(8px)', 'LAYER_BLUR "Lock frame": a locked thumbnail. Figma ties it to spacing/base-8 (16), and its blur radius is twice CSS\'s.'],
  ['shadow/floating', '0 16px 24px 0 rgba(0, 0, 0, 0.16)', 'DROP_SHADOW "Shadow/Floating" (alpha is opacity/soft).'],
]

// ── Figma's variables ──────────────────────────────────────────────────────

const vars = new Map(Object.entries(registry.variables))

// Library variables only show up in the per-component reads, as "Base / Black".
const raws = []
const walk = (dir) => { for (const e of readdirSync(dir)) { const p = join(dir, e); if (statSync(p).isDirectory()) walk(p); else if (e.endsWith('.get_variable_defs.txt')) raws.push(p) } }
walk(join(root, 'raw'))
const rawValues = new Map()
for (const f of raws) {
  for (const [k, v] of Object.entries(JSON.parse(readFileSync(f, 'utf8')))) {
    if (/^Font\(|^Effect\(/.test(v) || typeof v !== 'string') continue // text and effect styles, not variables
    rawValues.set(k.replace(/\s*\/\s*/g, '/'), v)
  }
}
for (const [name, v] of rawValues)
  if (!vars.has(name) && /^#[0-9a-f]{6,8}$/i.test(v)) vars.set(name, { collection: 'library', type: 'COLOR', value: v.toLowerCase() })

const modeValue = (v, mode) => (v.collection === 'theme' ? v[mode] : v.value)

/** Follows aliases down to a plain value, and says which primitive it ended on. */
function resolve(name, mode, seen = []) {
  const v = vars.get(name)
  if (!v) throw new Error(`${seen.at(-1) ?? name} points at ${name}, which isn't a variable`)
  if (seen.includes(name)) throw new Error(`alias loop: ${[...seen, name].join(' -> ')}`)
  const x = modeValue(v, mode)
  if (typeof x === 'string' && x.startsWith('@')) return resolve(x.slice(1), mode, [...seen, name])
  return { value: x, from: seen.length ? name : undefined }
}

/** Figma's number to CSS: opacities are percentages, weights are bare, the rest are pixels. */
function css(name, type, x) {
  if (type === 'COLOR') return String(x).toLowerCase()
  if (type === 'STRING') return name.startsWith('font-family/') ? [`'${x}'`, ...FONT_FALLBACKS].join(', ') : String(x)
  if (name.startsWith('opacity/')) return String(Number((x / 100).toFixed(4)))
  if (name.includes('font-weight')) return String(x)
  return `${x}px`
}

const cssVar = (name) => '--' + name.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-')

const tokens = {}
const byVar = new Map()
const add = (name, entry) => {
  const other = byVar.get(entry.cssVar)
  if (other) throw new Error(`${name} and ${other} would both be ${entry.cssVar}`)
  byVar.set(entry.cssVar, name)
  tokens[name] = entry
}

for (const [name, v] of vars) {
  const dark = resolve(name, 'dark')
  const entry = { cssVar: cssVar(name), value: css(name, v.type, dark.value), source: 'figma', collection: v.collection }
  if (dark.from) entry.alias = dark.from
  if (v.collection === 'theme') entry.light = css(name, v.type, resolve(name, 'light').value)
  add(name, entry)
}
const notes = new Map()
for (const [name, value, note] of ROST) {
  if (vars.has(name)) throw new Error(`${name} is a Figma variable now: take it out of ROST`)
  const plain = value.replace(/var\((--[\w-]+)\)/g, (m, ref) => tokens[byVar.get(ref)]?.value ?? m)
  add(name, { cssVar: cssVar(name), value: plain, source: 'rost' })
  notes.set(name, { css: value, note })
}

// The per-component reads and the full read should agree. Say so when they don't.
let disagree = 0
for (const [name, raw] of rawValues) {
  const t = tokens[name]
  if (!t || vars.get(name).type === 'STRING') continue
  const ours = t.value.replace(/px$/, '')
  const theirs = name.startsWith('opacity/') ? String(Number(raw) / 100) : String(raw).toLowerCase()
  if (ours !== theirs && t.source === 'figma') { disagree++; console.warn(`  ${name}: ${t.value} here, ${raw} in an older read`) }
}

// ── Writing ────────────────────────────────────────────────────────────────

const SECTIONS = [
  ['Typography', (n) => n.startsWith('font-family/') || n.startsWith('typography/')],
  ['Colour primitives (base)', (n) => n.startsWith('color/') || tokens[n].collection === 'library'],
  ['Surfaces and text', (n) => n.startsWith('non-interactive/')],
  ['Actions', (n) => n.startsWith('actions/')],
  ['Input', (n) => n.startsWith('input/')],
  ['Interactive (things you pick from a list)', (n) => n.startsWith('interactive/')],
  ['Projects', (n) => n.startsWith('project/')],
  ['Tabs', (n) => n.startsWith('tabs/')],
  ['Generic colours (no family in Figma)', (n) => !n.includes('/') && tokens[n].source === 'figma'],
  ['Spacing / base (the primitives)', (n) => n.startsWith('spacing/base')],
  ['Spacing / gap', (n) => n.startsWith('spacing/gap/')],
  ['Spacing / size', (n) => n.startsWith('spacing/size/')],
  ['Spacing / radius', (n) => n.startsWith('spacing/radius/')],
  ['Spacing / outline', (n) => n.startsWith('spacing/outline/')],
  ['Opacity', (n) => n.startsWith('opacity/')],
]
const sorted = Object.keys(tokens).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
const figma = sorted.filter((n) => tokens[n].source === 'figma')
const placed = new Set()
const blocks = []
for (const [title, test] of SECTIONS) {
  const list = figma.filter((n) => !placed.has(n) && test(n))
  list.forEach((n) => placed.add(n))
  if (list.length) blocks.push(`  /* ── ${title} ${'─'.repeat(Math.max(3, 70 - title.length))} */\n${list.map((n) => `  ${tokens[n].cssVar}: ${tokens[n].value};`).join('\n')}`)
}
const lost = figma.filter((n) => !placed.has(n))
if (lost.length) throw new Error(`no section for ${lost.join(', ')}`)
blocks.push(`  /* ── Rost's own (no Figma variable) ${'─'.repeat(38)} */\n${ROST.map(([n]) => `  /* ${notes.get(n).note} */\n  ${tokens[n].cssVar}: ${notes.get(n).css};`).join('\n')}`)

const cssOut = `/* Generated by bin/build-tokens.mjs from registry/figma-variables.json. Don't edit by hand: npm run tokens.
 *
 * Design tokens from UI Kit v01 (https://www.figma.com/design/${registry.fileKey}/UI-Kit-v01).
 * Every Figma variable is here, named after its Figma path with / as -, so
 * actions/primary/hover/background is --actions-primary-hover-background.
 * The values are the dark theme, Rost's default. Rost's own tokens come last.
 */

:root {
${blocks.join('\n\n')}
}
`
const jsonOut = JSON.stringify({
  $comment: "Generated by bin/build-tokens.mjs. Keys are the Figma names. value is the dark theme, light the light one (theme variables only), alias the variable it points at. source is figma, or rost for Rost's own.",
  count: sorted.length,
  tokens: Object.fromEntries(sorted.map((n) => [n, tokens[n]])),
}, null, 2) + '\n'

const outputs = [['tokens/tokens.css', cssOut], ['tokens/tokens.json', jsonOut]]
const stale = outputs.filter(([p, s]) => { try { return readFileSync(join(root, p), 'utf8') !== s } catch { return true } })
if (check) {
  if (stale.length) { console.error(`tokens: out of date (${stale.map(([p]) => p).join(', ')}). Run npm run tokens.`); process.exit(1) }
  console.log(`tokens: up to date (${sorted.length})`)
} else {
  for (const [p, s] of outputs) writeFileSync(join(root, p), s)
  console.log(`tokens: ${figma.length} from Figma, ${ROST.length} of Rost's own${disagree ? `, ${disagree} disagree with an older read` : ''}`)
}

#!/usr/bin/env node
/**
 * Turns a variant's design context into contract values.
 *
 * The context is React + Tailwind arbitrary values, each carrying its token and
 * a fallback: `h-[var(--spacing\/size\/small,24px)]`. Both halves matter — the
 * path is what a contract asserts, the value is what conformance measures.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const RAW = new URL('../raw/variants/', import.meta.url).pathname

// Tailwind prefix -> CSS property. Order matters: longest prefix first.
const PROPS = [
  ['rounded', 'border-radius'], ['leading', 'line-height'], ['tracking', 'letter-spacing'],
  ['opacity', 'opacity'], ['gap', 'gap'], ['size', 'size'],
  ['pt', 'padding-top'], ['pb', 'padding-bottom'], ['pl', 'padding-left'], ['pr', 'padding-right'],
  ['px', 'padding-x'], ['py', 'padding-y'], ['p', 'padding'],
  ['bg', 'background'], ['border', 'border'], ['text', 'text'], ['h', 'height'], ['w', 'width'],
  // Both carry tokens in every read and were silently dropped: no contract
  // stated a font family or weight, nor the 1px width of the top/left edge.
  ['font', 'font'], ['border-t', 'border-top-width'],
]

const unescape = (s) => s.replace(/\\+/g, '')

/** `h-[var(--spacing\/size\/small,24px)]` -> {property, token, value} */
function parseClass(cls) {
  // Opacity arrives as a percentage variable divided down:
  // `opacity-[calc(var(--opacity/mild,32)/100)]`. The token is in there.
  const pct = cls.match(/^([a-z-]+)-\[calc\(var\(--([^,]+),\s*([\d.]+)\)\/100\)\]$/)
  if (pct) {
    const hit = PROPS.find(([p]) => pct[1] === p)
    if (hit) return { property: hit[1], token: unescape(pct[2]).replace(/\\/g, ''), value: String(Number(pct[3]) / 100) }
  }
  // The fallback may itself hold parentheses — `rgba(237,237,237,0.64)` — so it
  // is read as "anything up to the var's own closing paren", one level deep.
  // Stopping at the first `)` dropped the token from every rgba border.
  const m = cls.match(/^([a-z-]+)-\[(?:(color|length|family-name):)?var\(--([^,]+),\s*((?:[^()]|\([^()]*\))+)\)\]$/)
  if (!m) {
    const plain = cls.match(/^([a-z-]+)-\[([^\]]+)\]$/)
    if (!plain) return null
    const hit = PROPS.find(([p]) => plain[1] === p)
    return hit ? { property: hit[1], value: plain[2], token: null } : null
  }
  const [, prefix, hint, rawToken, rawValue] = m
  const hit = PROPS.find(([p]) => prefix === p)
  if (!hit) return null
  let property = hit[1]
  if (property === 'text') property = hint === 'length' ? 'font-size' : 'color'
  if (property === 'font') property = hint === 'family-name' ? 'font-family' : 'font-weight'
  if (property === 'border' && hint === 'length') property = 'border-width'
  else if (property === 'border') property = 'border-color'
  let value = unescape(rawValue).trim()
  // Figma names the font file, `'General_Sans_Variable:Medium'`; CSS names the family.
  if (property === 'font-family') value = `'${value.replace(/^'|'$/g, '').split(':')[0].replace(/_/g, ' ')}'`
  return { property, token: unescape(rawToken).replace(/\\/g, ''), value }
}

function expand(entry) {
  const { property, token, value } = entry
  const out = {}
  const set = (p) => (out[p] = token ? { token, value } : { value })
  if (property === 'padding-x') { set('padding-left'); set('padding-right') }
  else if (property === 'padding-y') { set('padding-top'); set('padding-bottom') }
  else if (property === 'size') { set('width'); set('height') }
  else set(property)
  return out
}

/** The root element's class list, plus each named sub-part's. */
/**
 * Each element is read as the slice of source from its `<div` to the next one.
 *
 * Scanning a className expression in place fights nested templates:
 * `${String.raw`...`}` flips quoting state twice, so brace counting truncates
 * the expression and drops the conditional tail — which is exactly where a
 * variant's distinguishing values live (a Badge's status colour appears there
 * and nowhere else). Slicing between elements sidesteps the nesting entirely:
 * whatever is in the slice belongs to that element.
 *
 * Ternaries inside a slice keep their TRUE branch, which in a per-variant read
 * is always that variant's own.
 */
/**
 * Builds the scope a variant's conditionals are evaluated in.
 *
 * The generated code's own default props CANNOT be trusted to identify the
 * variant — reading node 25:80 (type=Secondary) still emits
 * `type = "Primary"` in the signature. The variant name in the header is the
 * only reliable statement of what was read, so predicates are evaluated
 * against that.
 */
function scopeFor(src, variantName) {
  const scope = {}
  for (const pair of (variantName || '').split(',')) {
    const [k, v] = pair.split('=').map((x) => x?.trim())
    if (k && v !== undefined) scope[k] = v
  }
  // `const isSecondary = type === "Secondary";` — evaluated in declaration order.
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*([^;]+);/g)) {
    const [, name, expr] = m
    try {
      const keys = Object.keys(scope)
      scope[name] = new Function(...keys, `return (${expr})`)(...keys.map((k) => scope[k]))
    } catch { scope[name] = false }
  }
  return scope
}

/**
 * Resolves ternaries by actually evaluating their condition.
 *
 * Keeping the first branch unconditionally was right for a single-axis
 * component (Badge's only predicate is its own status) and quietly wrong for
 * every multi-axis one: a Secondary button's file contains BOTH
 * actions/primary/default/label and actions/secondary/regular/default/label,
 * and taking the first gave every button type the primary label colour — a
 * contract that looked complete and was wrong in the one place it mattered.
 */
function resolveConditionals(text, scope) {
  const keys = Object.keys(scope)
  const evaluate = (cond) => {
    try { return !!new Function(...keys, `return (${cond})`)(...keys.map((k) => scope[k])) }
    catch { return null }
  }
  let e = text
  for (let i = 0; i < 20; i++) {
    const next = e.replace(
      /([^?:{}`]+?)\?\s*(String\.raw`[^`]*`|"[^"]*")\s*:\s*(String\.raw`[^`]*`|"[^"]*")/g,
      (whole, cond, truthy, falsy) => {
        const v = evaluate(cond.trim())
        return v === null ? whole : ' ' + (v ? truthy : falsy) + ' '
      })
    if (next === e) break
    e = next
  }
  // `cond && "classes"` appears too.
  return e.replace(/([^?:{}`]+?)&&\s*(String\.raw`[^`]*`|"[^"]*")/g,
    (whole, cond, val) => { const v = evaluate(cond.trim()); return v === null ? whole : (v ? ' ' + val + ' ' : ' ') })
}

/**
 * Removes the blocks this variant does not render.
 *
 * A multi-axis component emits every type's markup side by side, each wrapped
 * in `{isPrimary && ...}`. Nothing about the elements themselves says which
 * applies, so reading the first `<p>` gave every button type the PRIMARY
 * label colour — the contract looked complete and was wrong exactly where the
 * types differ. Evaluating the guard is the only thing that distinguishes them.
 */
function stripFalseGuards(src, scope) {
  const keys = Object.keys(scope)
  const evaluate = (cond) => {
    try { return !!new Function(...keys, `return (${cond})`)(...keys.map((k) => scope[k])) }
    catch { return null }
  }
  let out = src
  for (let pass = 0; pass < 30; pass++) {
    const m = out.match(/\{\s*([A-Za-z_$][\w$]*(?:\s*&&\s*[A-Za-z_$][\w$]*)*)\s*&&/)
    if (!m) break
    const open = m.index
    const verdict = evaluate(m[1])
    // Find this block's closing brace, ignoring braces inside strings.
    let depth = 0, i = open, q = null
    for (; i < out.length; i++) {
      const c = out[i]
      if (q) { if (c === q && out[i - 1] !== '\\') q = null; continue }
      if (c === '"' || c === "'" || c === '`') { q = c; continue }
      if (c === '{') depth++
      else if (c === '}') { depth--; if (depth === 0) break }
    }
    const block = out.slice(open, i + 1)
    // Keep true blocks but neutralise the marker so the scan moves on.
    out = out.slice(0, open) + (verdict === false ? ' ' : block.replace('&&', '/*&&*/')) + out.slice(i + 1)
  }
  return out
}

function partsOf(src, scope) {
  // <p> and <span> are elements too — the label is a <p>, and slicing only on
  // <div> folded its typography into whichever div preceded it (the icon's
  // vector node), which then failed conformance against a part that has no
  // counterpart in code at all.
  const starts = [...src.matchAll(/<(?:div|p|span)\b/g)].map((m) => m.index)
  const parts = {}
  starts.forEach((from, i) => {
    const slice = resolveConditionals(src.slice(from, starts[i + 1] ?? src.length), scope)
    const arbitrary = [...slice.matchAll(/[\w-]+-\[(?:[a-z]+:)?var\([^\]]*\)\]|[\w-]+-\[[^\]\s]*\]/g)].map((m) => m[0])
    // Bare utilities (border-l, absolute, inset-0) live in the same className
    // and carry real decisions, so they are collected alongside.
    // Scanned on the resolved slice, not on a re-extracted className: that
    // extraction truncated at the first `}` inside a nested ${String.raw`...`},
    // which is exactly where the selected toggle declares its two-sided border.
    const bare = [...slice.matchAll(/(?<![\w-])(border-[lrtb]|border|absolute|relative|inset-0|overflow-clip|justify-center|items-center)(?![\w-[])/g)]
      .map((m) => m[1])
    const classes = [...arbitrary, ...bare].join(' ')
    const name = slice.match(/data-name="([^"]+)"/)?.[1]
    // A text node with no data-name is the component's label.
    const isText = /^<p\b/.test(slice)
    const key = i === 0 ? 'root' : isText ? 'label' : name ? name.toLowerCase().replace(/[^\w]+/g, '-') : null
    if (!key || !classes || parts[key]) return
    parts[key] = classes
  })
  return parts
}

/**
 * Bare utility classes that carry design decisions.
 *
 * Only arbitrary values (`border-[var(...)]`) were being read, so `border-l`
 * and `border-t` were dropped on the floor — and with them the fact that the
 * toggle's outline is drawn on TWO sides, not four. The contract looked
 * complete and described a component the kit does not contain. A property that
 * is expressed as a bare class is still a property.
 */
const SIDES = { 'border-l': 'left', 'border-r': 'right', 'border-t': 'top', 'border-b': 'bottom' }

function structuralOf(classes) {
  const list = classes.split(/\s+/)
  const out = {}
  // A side can be declared bare (`border-l`) or with a width
  // (`border-t-[length:var(--spacing/outline/small,1px)]`). Both mean the
  // border is drawn on that side; counting only the bare form reported the
  // toggle's outline as one-sided when it is two.
  const sides = [...new Set(list.flatMap((c) => {
    if (SIDES[c]) return [SIDES[c]]
    const m = c.match(/^(border-[lrtb])-\[/)
    return m && SIDES[m[1]] ? [SIDES[m[1]]] : []
  }))]
  // An explicit side list means the border is partial; no sides with a border
  // colour set means all four.
  if (sides.length) out['border-sides'] = { value: sides.sort().join(' ') }
  // No side named, but a border colour or width set, means all four.
  else if (list.includes('border') || list.some((c) => /^border-\[/.test(c)))
    out['border-sides'] = { value: 'all' }
  if (list.includes('absolute')) out['position'] = { value: 'absolute' }
  if (list.includes('inset-0')) out['inset'] = { value: '0' }
  if (list.includes('overflow-clip')) out['overflow'] = { value: 'clip' }
  if (list.includes('justify-center')) out['justify-content'] = { value: 'center' }
  if (list.includes('items-center')) out['align-items'] = { value: 'center' }
  return out
}

export function parseVariant(file) {
  const src = readFileSync(file, 'utf8')
  const header = src.match(/^\/\* (.+?) \| (.+?) \| (.+?) \| (.+?) \*\//)
  const values = {}
  const scope = scopeFor(src, header?.[2])
  for (const [part, classes] of Object.entries(partsOf(stripFalseGuards(src, scope), scope))) {
    const acc = { ...structuralOf(classes) }
    for (const cls of classes.split(/\s+/)) {
      const p = parseClass(cls)
      if (p) Object.assign(acc, expand(p))
    }
    if (Object.keys(acc).length) values[part] = acc
  }
  return {
    component: header?.[1], variant: header?.[2], nodeId: header?.[3], size: header?.[4], values,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const byComp = {}
  for (const f of readdirSync(RAW).filter((f) => f.endsWith('.txt'))) {
    const v = parseVariant(join(RAW, f))
    ;(byComp[v.component] ??= []).push(v)
  }
  writeFileSync(new URL('../raw/parsed.json', import.meta.url), JSON.stringify(byComp, null, 2))
  for (const [c, vs] of Object.entries(byComp)) {
    const props = new Set(vs.flatMap((v) => Object.entries(v.values).flatMap(([p, o]) => Object.keys(o).map((k) => `${p}.${k}`))))
    console.log(`  ${c.padEnd(15)} ${String(vs.length).padStart(2)} variants, ${props.size} properties captured`)
  }
}

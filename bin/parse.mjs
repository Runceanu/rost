#!/usr/bin/env node
/**
 * Turns a variant's design context into contract values.
 *
 * The context is React + Tailwind arbitrary values, each carrying its token and
 * a fallback: `h-[var(--spacing\/size\/small,24px)]`. Both halves matter: the
 * path is what a contract asserts, the value is what conformance measures.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAW = fileURLToPath(new URL('../raw/variants/', import.meta.url))

// Tailwind prefix -> CSS property, matched exactly.
const PROPS = [
  ['rounded', 'border-radius'], ['leading', 'line-height'], ['tracking', 'letter-spacing'],
  ['opacity', 'opacity'], ['gap', 'gap'], ['size', 'size'],
  ['pt', 'padding-top'], ['pb', 'padding-bottom'], ['pl', 'padding-left'], ['pr', 'padding-right'],
  ['px', 'padding-x'], ['py', 'padding-y'], ['p', 'padding'],
  ['bg', 'background'], ['border', 'border'], ['text', 'text'], ['h', 'height'], ['w', 'width'],
  // Both carry tokens in every read and were silently dropped: no contract
  // stated a font family or weight, nor the 1px width of the top/left edge.
  ['font', 'font'], ['border-t', 'border-top-width'],
  // Where a vector sits inside its icon frame: `inset-[3.9%_3.91%_4.43%_4.42%]`.
  ['inset', 'inset'],
  ['min-w', 'min-width'], ['min-h', 'min-height'],
  // Offsets of an absolutely placed part, like Thumbs' panel: `bottom-[8px]`.
  ['top', 'top'], ['right', 'right'], ['bottom', 'bottom'], ['left', 'left'],
]

const unescape = (s) => s.replace(/\\+/g, '')

/** `h-[var(--spacing\/size\/small,24px)]` -> {property, token, value} */
function parseClass(cls) {
  // Opacity arrives as a percentage variable divided down:
  // `opacity-[calc(var(--opacity/mild,32)/100)]`. The token is in there.
  const pct = cls.match(/^([a-z-]+)-\[calc\(var\(--([^,]+),\s*([\d.]+)\)\/100\)\]$/)
  if (pct) {
    const hit = PROPS.find(([p]) => pct[1] === p)
    if (hit) return { property: hit[1], token: unescape(pct[2]), value: String(Number(pct[3]) / 100) }
  }
  // The fallback may itself hold parentheses (`rgba(237,237,237,0.64)`), so it
  // is read as "anything up to the var's own closing paren", one level deep.
  // Stopping at the first `)` dropped the token from every rgba border.
  const m = cls.match(/^([a-z-]+)-\[(?:(color|length|family-name):)?var\(--([^,]+),\s*((?:[^()]|\([^()]*\))+)\)\]$/)
  if (!m) {
    const plain = cls.match(/^([a-z-]+)-\[([^\]]+)\]$/)
    if (!plain) return null
    const hit = PROPS.find(([p]) => plain[1] === p)
    return hit ? { property: hit[1], value: plain[2].replace(/_/g, ' '), token: null } : null
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
  // Figma names the font file, `'General_Sans_Variable:Medium'` (single or
  // double quotes); CSS names the family.
  if (property === 'font-family') value = `'${value.replace(/^['"]|['"]$/g, '').split(':')[0].replace(/_/g, ' ')}'`
  return { property, token: unescape(rawToken), value }
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

/**
 * Builds the scope a variant's conditionals are evaluated in.
 *
 * The generated code's own default props CANNOT be trusted to identify the
 * variant. Reading node 25:80 (type=Secondary) still emits
 * `type = "Primary"` in the signature. The variant name in the header is the
 * only reliable statement of what was read, so predicates are evaluated
 * against that.
 */
function scopeFor(src, variantName) {
  const scope = {}
  // Booleans and slots that aren't variant axes (showIcon, showSlot) are only
  // known from the defaults in the signature. Without them a guard like
  // `showIcon && (...)` couldn't be evaluated, so the block stayed in, even
  // though Figma draws the component with it off. The variant name still
  // wins for its own axes, since those defaults can't be trusted.
  const sig = src.match(/function \w+\(\{([^}]*)\}/)?.[1] ?? ''
  for (const m of sig.matchAll(/(\w+)\s*=\s*(true|false|null)\b/g)) scope[m[1]] = m[2] === 'true' ? true : m[2] === 'false' ? false : null
  for (const pair of (variantName || '').split(',')) {
    const [k, v] = pair.split('=').map((x) => x?.trim())
    // `selected=False` (or `collapsed=false`) is the boolean false: the code
    // tests `!selected`, and the string "False" is truthy, so every off
    // variant read as on.
    if (k && v !== undefined) scope[k] = /^true$/i.test(v) ? true : /^false$/i.test(v) ? false : v
  }
  // `const isSecondary = type === "Secondary";`, evaluated in declaration order.
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
 * and taking the first gave every button type the primary label colour, a
 * contract that looked complete and was wrong in the one place it mattered.
 */
/** true or false for a condition in the variant's scope, or null when it can't be told. */
function evaluator(scope) {
  const keys = Object.keys(scope)
  return (cond) => {
    try { return !!new Function(...keys, `return (${cond})`)(...keys.map((k) => scope[k])) }
    catch { return null }
  }
}

function resolveConditionals(text, scope) {
  const evaluate = evaluator(scope)
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
 * label colour. The contract looked complete and was wrong exactly where the
 * types differ. Evaluating the guard is the only thing that distinguishes them.
 */
function stripFalseGuards(src, scope) {
  const evaluate = evaluator(scope)
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

/**
 * Each element is read as the slice of source from its tag to the next one.
 *
 * Scanning a className expression in place fights nested templates:
 * `${String.raw`...`}` flips quoting state twice, so brace counting truncates
 * the expression and drops the conditional tail, which is exactly where a
 * variant's own values live. Slicing between elements sidesteps the nesting:
 * whatever is in the slice belongs to that element.
 */
function partsOf(src, scope) {
  // <p> and <span> are elements too: the label is a <p>, and slicing only on
  // <div> folded its typography into whichever div preceded it (the icon's
  // vector node), which then failed conformance against a part that has no
  // counterpart in code at all.
  // <img> is an element too: Figma now exports icons as one image filling
  // its frame. Left out, its `absolute inset-0` leaked into the frame above.
  const starts = [...src.matchAll(/<(?:div|p|span|img)\b/g)].map((m) => m.index)
  const parts = {}
  starts.forEach((from, i) => {
    const slice = resolveConditionals(src.slice(from, starts[i + 1] ?? src.length), scope)
    const arbitrary = [...slice.matchAll(/[\w-]+-\[(?:[a-z]+:)?var\([^\]]*\)\]|[\w-]+-\[[^\]\s]*\]/g)].map((m) => m[0])
    // Bare utilities (border-l, absolute, inset-0) live in the same className
    // and carry real decisions, so they are collected alongside.
    // Scanned on the resolved slice, not on a re-extracted className: that
    // extraction truncated at the first `}` inside a nested ${String.raw`...`},
    // which is exactly where the selected toggle declares its two-sided border.
    const bare = [...slice.matchAll(/(?<![\w-])(border-[lrtb]|border|absolute|relative|inset-0|overflow-clip|justify-center|items-center|flex|flex-col|flex-row|shrink-0|flex-\[1_0_0\]|whitespace-nowrap|text-center|w-full|h-full|items-start|justify-end|justify-between|self-stretch)(?![\w-[])/g)]
      .map((m) => m[1])
    const classes = [...arbitrary, ...bare].join(' ')
    const name = slice.match(/data-name="([^"]+)"/)?.[1]
    // A text node with no data-name is the component's label.
    const isText = /^<p\b/.test(slice)
    // When the text sits inside a frame Figma calls "label", that frame takes
    // the name and the text becomes `text`. Before, both wanted `label` and
    // the text lost, taking the font, size and colour with it.
    const isImage = /^<img\b/.test(slice)
    const key = i === 0 ? 'root' : isImage ? null : isText ? (parts.label ? 'text' : 'label') : name ? name.toLowerCase().replace(/[^\w]+/g, '-') : null
    if (!key || !classes || parts[key]) return
    parts[key] = classes
  })
  return parts
}

/**
 * Bare utility classes that carry design decisions.
 *
 * Only arbitrary values (`border-[var(...)]`) were being read, so `border-l`
 * and `border-t` were dropped on the floor, and with them the fact that the
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
  if (sides.length) out['border-sides'] = { value: sides.sort().join(' ') }
  // No side named, but a border colour or width set, means all four.
  else if (list.includes('border') || list.some((c) => /^border-\[/.test(c)))
    out['border-sides'] = { value: 'all' }
  if (list.includes('absolute')) out['position'] = { value: 'absolute' }
  if (list.includes('inset-0')) out['inset'] = { value: '0' }
  if (list.includes('overflow-clip')) out['overflow'] = { value: 'clip' }
  if (list.includes('justify-center')) out['justify-content'] = { value: 'center' }
  if (list.includes('items-center')) out['align-items'] = { value: 'center' }
  // How the box lays out its children. Without these the contract could not
  // say whether a part is a row or a column, or which parts may shrink.
  const LAYOUT = {
    'flex': ['display', 'flex'], 'flex-col': ['flex-direction', 'column'], 'flex-row': ['flex-direction', 'row'],
    'shrink-0': ['flex-shrink', '0'], 'flex-[1_0_0]': ['flex', '1 0 0'], 'whitespace-nowrap': ['white-space', 'nowrap'],
    'text-center': ['text-align', 'center'], 'w-full': ['width', '100%'], 'h-full': ['height', '100%'],
    'items-start': ['align-items', 'flex-start'], 'justify-end': ['justify-content', 'flex-end'],
    'justify-between': ['justify-content', 'space-between'], 'self-stretch': ['align-self', 'stretch'],
  }
  for (const [cls, [prop, value]] of Object.entries(LAYOUT)) if (list.includes(cls) && !out[prop]) out[prop] = { value }
  if (list.includes('relative') && !list.includes('absolute')) out['position'] = { value: 'relative' }
  return out
}

export function parseVariant(file) {
  const src = readFileSync(file, 'utf8')
  const header = src.match(/^\/\* (.+?) \| (.+?) \| (.+?) \| (.+?) \*\//)
  const read = (scope) => {
    const values = {}
    for (const [part, classes] of Object.entries(partsOf(stripFalseGuards(src, scope), scope))) {
      const acc = { ...structuralOf(classes) }
      for (const cls of classes.split(/\s+/)) {
        const p = parseClass(cls)
        if (p) Object.assign(acc, expand(p))
      }
      if (Object.keys(acc).length) values[part] = acc
    }
    return values
  }
  // As Figma draws it: optional parts off, the way the screenshot shows it.
  const scope = scopeFor(src, header?.[2])
  const values = read(scope)
  // Then with every optional part switched on (showLeading, showIcon...), so
  // a part that's off by default still has its spec. Those parts are marked
  // optional, and the values of parts that are on anyway don't change.
  const optional = []
  const shows = Object.keys(scope).filter((k) => /^show[A-Z]/.test(k) && scope[k] === false)
  if (shows.length) {
    const on = scopeFor(src, header?.[2])
    for (const k of shows) on[k] = true
    for (const [part, acc] of Object.entries(read(on))) if (!values[part]) { values[part] = acc; optional.push(part) }
  }
  return {
    component: header?.[1], variant: header?.[2], nodeId: header?.[3], size: header?.[4], values, optional,
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
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

#!/usr/bin/env node
/**
 * Writes a component's stylesheet from its contract.
 *
 *   node bin/build-css.mjs <id> [<id> ...]   ->  src/components/<id>/<id>.css
 *
 * Every part becomes `.rost-<id>__<part>`, every prop value a modifier on the
 * root (`.rost-<id>--size-small`, `.rost-<id>--selected`), and every value is
 * written as its token's CSS variable. Interaction states become the
 * pseudo-classes the browser already gives us. Nothing here is typed by hand:
 * if the CSS is wrong, the contract is wrong.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { read } from './lib/contract-io.mjs'
import { STATE_PSEUDO as PSEUDO, variantsOf } from './lib/kit.mjs'

const kebab = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
const cssVar = (path) => `var(--${path.replace(/\//g, '-')})`

function declarations(styles, { root }) {
  const out = []
  const sides = styles['border-sides']?.value
  for (const [prop, v] of Object.entries(styles)) {
    if (prop === 'border-sides') continue
    // A root size with no token is the Figma frame, not the component.
    if (root && (prop === 'width' || prop === 'height') && v.assert === false && !v.token) continue
    const value = v.token ? cssVar(v.token) : v.suggest ? cssVar(v.suggest) : v.value
    if (sides && (prop === 'border-color' || prop === 'border-width') && sides !== 'all') {
      for (const side of sides.split(' ')) out.push(`border-${side}-${prop.split('-')[1]}: ${value};`)
      continue
    }
    out.push(`${prop}: ${value};`)
  }
  if (sides) {
    // A side with no width of its own is Figma's default stroke, 1px
    // (`border-l` next to `border-t-[1px]`), never the browser's 3px.
    const fallback = 'var(--spacing-outline-small)'
    if (sides === 'all') out.push('border-style: solid;', ...(styles['border-width'] ? [] : [`border-width: ${fallback};`]))
    else for (const side of sides.split(' ')) out.push(`border-${side}-style: solid;`, ...(styles['border-width'] || styles[`border-${side}-width`] ? [] : [`border-${side}-width: ${fallback};`]))
  }
  return out
}

function build(id) {
  const c = read(id)
  const base = `rost-${id}`
  // A part can be a pseudo-element of the root (`pseudo: ::backdrop`) instead of an element of its own,
  // or of another part (`pseudo: ::placeholder`, `of: search` is `.rost-x__search::placeholder`).
  const pseudo = (p) => { const e = c.elements?.[p]; return e?.pseudo && `${e.of ? `__${kebab(e.of)}` : ""}${e.pseudo}` }
  const owned = (p) => Boolean(c.elements?.[p]?.of)
  const part = (p) => (p === 'root' ? `.${base}` : pseudo(p) ? `.${base}${pseudo(p)}` : `.${base}__${kebab(p)}`)
  const rules = [
    `/* Generated from contracts/${id}.contract.yaml by bin/build-css.mjs. Don't edit: change the contract and rebuild. */`,
    '',
    // Its own parts and plain elements, not another Rost component inside it:
    // that one has its own reset, and its own margins (a Popover's 8px) must stand.
    `.${base}, .${base} :where(:not([class*="rost-"]), [class*="${base}__"]) { box-sizing: border-box; margin: 0; }`,
    // Figma exports every icon and image as one picture filling its frame. Only
    // the component's own pictures: an image a caller passes in stays as it is.
    `.${base} > img, .${base} [class*="__icons-"] > img { display: block; position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; }`,
    // A field's placeholder is drawn in the field's own colour token, not the browser's grey.
    `.${base} ::placeholder { color: inherit; opacity: 1; }`,
  ]
  const rule = (selector, decls) => { if (decls.length) rules.push('', `${selector} {`, ...decls.map((d) => `  ${d}`), '}') }

  for (const [p, e] of Object.entries(c.elements ?? {})) rule(part(p), declarations(e.styles ?? {}, { root: p === 'root' }))

  // One rule per variant with its layers already in, so the selectors are
  // the same whether a contract writes its variants out or in layers.
  // What Disabled is on this component, without the :is() wrapper so it reads plainly inside :not().
  const disabledOf = (c) => (c.stateSelectors?.Disabled ?? PSEUDO.Disabled).replace(/^:is\((.*)\)$/, '$1')
  for (const v of variantsOf(c)) {
    let root = `.${base}`
    for (const [prop, val] of Object.entries(v.when)) {
      // Hover, press and focus, only on the element that can have them
      // (`statesOn`). Disabled isn't one: a disabled link has no href.
      // A state that belongs to a part inside (`stateSelectors`), like a disclosure's button.
      if (prop === 'state' && c.stateSelectors?.[val]) root += c.stateSelectors[val]
      else if (prop === 'state' && PSEUDO[val] && c.statesOn && val !== 'Disabled' && val !== 'Default') root = `${c.statesOn}${root}${PSEUDO[val]}`
      else if (prop === 'state') root += PSEUDO[val] ?? `.${base}--state-${kebab(val)}`
      else if (val === true) root += `.${base}--${kebab(prop)}`
      // A false boolean has no class of its own; say so, or its rules would
      // also land on the true variant.
      else if (val === false) root += `:not(.${base}--${kebab(prop)})`
      else root += `.${base}--${kebab(prop)}-${kebab(val)}`
      // A disabled item doesn't react: hover and press skip it, or their looks
      // would show through wherever the Disabled rule doesn't set its own.
      // :where() keeps the rule's weight as it was, so focus still wins as before.
      if (prop === 'state' && (val === 'Hover' || val === 'Pressed') && c.states?.includes('Disabled')) root += `:where(:not(${disabledOf(c)}))`
    }
    for (const [p, styles] of Object.entries(v.elements ?? {}))
      rule(p === 'root' ? root : pseudo(p) && !owned(p) ? `${root}${pseudo(p)}` : `${root} ${part(p)}`, declarations(styles, { root: p === 'root' }))
  }

  // Named animations, and what they become for someone who asks for less motion.
  for (const [name, steps] of Object.entries(c.keyframes ?? {})) {
    rules.push('', `@keyframes ${base}-${name} {`)
    for (const [at, decls] of Object.entries(steps)) rules.push(`  ${at} { ${Object.entries(decls).map(([k, v]) => `${k}: ${v};`).join(' ')} }`)
    rules.push('}')
  }
  if (c.reducedMotion) {
    rules.push('', '@media (prefers-reduced-motion: reduce) {')
    for (const [p, styles] of Object.entries(c.reducedMotion.elements)) {
      const decls = declarations(styles, { root: p === 'root' })
      if (decls.length) rules.push(`  ${part(p)} { ${decls.join(' ')} }`)
    }
    rules.push('}')
  }

  const dir = new URL(`../src/components/${id}/`, import.meta.url)
  mkdirSync(dir, { recursive: true })
  writeFileSync(new URL(`${id}.css`, dir), rules.join('\n') + '\n')
  console.log(`  ${id}.css  ${rules.filter((r) => r.endsWith('{')).length} rules`)
}

const ids = process.argv.slice(2)
if (!ids.length) { console.log('Usage: node bin/build-css.mjs <id> [<id> ...]'); process.exit(1) }
for (const id of ids) build(id)

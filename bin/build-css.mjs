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

const kebab = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
const cssVar = (path) => `var(--${path.replace(/\//g, '-')})`
const PSEUDO = { Default: '', Hover: ':hover', Pressed: ':active', Focus: ':focus-visible', Disabled: ':disabled' }

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
    const width = styles['border-width'] || styles['border-top-width'] ? null : '1px'
    if (sides === 'all') out.push('border-style: solid;', ...(width ? [`border-width: ${width};`] : []))
    else for (const side of sides.split(' ')) out.push(`border-${side}-style: solid;`, ...(width ? [`border-${side}-width: ${width};`] : []))
  }
  return out
}

function build(id) {
  const c = read(id)
  const base = `rost-${id}`
  const part = (p) => (p === 'root' ? `.${base}` : `.${base}__${kebab(p)}`)
  const rules = [
    `/* Generated from contracts/${id}.contract.yaml by bin/build-css.mjs. Don't edit: change the contract and rebuild. */`,
    '',
    `.${base}, .${base} * { box-sizing: border-box; margin: 0; }`,
    // Figma exports every icon and image as one picture filling its frame.
    `.${base} img { display: block; position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; }`,
  ]
  const rule = (selector, decls) => { if (decls.length) rules.push('', `${selector} {`, ...decls.map((d) => `  ${d}`), '}') }

  for (const [p, e] of Object.entries(c.elements ?? {})) rule(part(p), declarations(e.styles ?? {}, { root: p === 'root' }))

  for (const v of c.variants ?? []) {
    let root = `.${base}`
    for (const [prop, val] of Object.entries(v.when)) {
      if (prop === 'state') root += PSEUDO[val] ?? `.${base}--state-${kebab(val)}`
      else if (val === true) root += `.${base}--${kebab(prop)}`
      else if (val !== false) root += `.${base}--${kebab(prop)}-${kebab(val)}`
    }
    for (const [p, styles] of Object.entries(v.elements ?? {}))
      rule(p === 'root' ? root : `${root} ${part(p)}`, declarations(styles, { root: p === 'root' }))
  }

  const dir = new URL(`../src/components/${id}/`, import.meta.url)
  mkdirSync(dir, { recursive: true })
  writeFileSync(new URL(`${id}.css`, dir), rules.join('\n') + '\n')
  console.log(`  ${id}.css  ${rules.filter((r) => r.endsWith('{')).length} rules`)
}

const ids = process.argv.slice(2)
if (!ids.length) { console.log('Usage: node bin/build-css.mjs <id> [<id> ...]'); process.exit(1) }
for (const id of ids) build(id)

#!/usr/bin/env node
/**
 * Validates every contract: the schema, then what a schema cannot see —
 * references between files, variant conditions against declared props, and
 * token paths against tokens.css. Exits 1 on any error, so CI can gate on it.
 */
import { readFileSync } from 'node:fs'
import Ajv from 'ajv/dist/2020.js'
import { read, ids } from './lib/contract-io.mjs'

const schema = JSON.parse(readFileSync(new URL('../schema/component-contract.schema.json', import.meta.url), 'utf8'))
const validate = new Ajv({ allErrors: true, validateFormats: false, allowUnionTypes: true }).compile(schema)

// tokens.json keys lost their hyphens (`non-interactive` → `non/interactive`);
// the CSS variable did not, so compare on that.
const cssVars = new Set(Object.values(JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8')).tokens).map((t) => t.cssVar))
const resolves = (path) => cssVars.has('--' + path.replace(/\//g, '-'))

const all = ids()
const errors = []
const warnings = []
const proposals = []

for (const id of all) {
  const c = read(id)
  const err = (m) => errors.push(`${id}: ${m}`)

  if (!validate(c)) for (const e of validate.errors) err(`${e.instancePath || '/'} ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : ''}`)
  if (c.id !== id) err(`id "${c.id}" does not match its file name`)
  for (const r of c.related ?? []) if (!all.includes(r)) err(`related "${r}" is not a contract`)

  for (const [i, v] of (c.variants ?? []).entries()) {
    for (const [k, val] of Object.entries(v.when ?? {})) {
      if (k === 'state') { if (!c.states?.includes(val)) err(`variants[${i}] state "${val}" is not in states`); continue }
      const p = c.props?.[k]
      if (!p) err(`variants[${i}] "${k}" is not a prop`)
      else if (p.type === 'boolean' && typeof val !== 'boolean') err(`variants[${i}] "${k}" must be true or false`)
      else if (p.type === 'enum' && !p.values.includes(val)) err(`variants[${i}] ${k}: "${val}" is not one of ${p.values.join(', ')}`)
    }
    for (const part of Object.keys(v.elements ?? {})) if (!c.elements?.[part]) err(`variants[${i}] styles "${part}", which is not in elements`)
  }

  const tokens = new Set()
  for (const e of Object.values(c.elements ?? {})) for (const v of Object.values(e.styles ?? {})) if (v.token) tokens.add(v.token)
  for (const v of c.variants ?? []) for (const s of Object.values(v.elements ?? {})) for (const x of Object.values(s)) if (x.token) tokens.add(x.token)
  for (const t of tokens) if (!resolves(t)) warnings.push(`${id}: token ${t} does not resolve in tokens.css`)

  // A suggestion of a token that does not exist is a proposal for a new one.
  const suggests = new Set()
  for (const e of Object.values(c.elements ?? {})) for (const v of Object.values(e.styles ?? {})) if (v.suggest) suggests.add(v.suggest)
  for (const v of c.variants ?? []) for (const s of Object.values(v.elements ?? {})) for (const x of Object.values(s)) if (x.suggest) suggests.add(x.suggest)
  for (const t of suggests) if (!resolves(t)) proposals.push(`${id}: proposes new token ${t}`)

  if (c.status === 'stable' && c.guidance?.status !== 'agreed') err('is stable, but its guidance is not agreed')
  if (c.status === 'stable' && c.pending) err('is stable, but still has pending reads')
}

for (const p of proposals) console.log(`  new   ${p}`)
for (const w of warnings) console.log(`  warn  ${w}`)
for (const e of errors) console.log(`  error ${e}`)
console.log(`${all.length} contracts: ${errors.length} errors, ${warnings.length} warnings`)
process.exit(errors.length ? 1 : 0)

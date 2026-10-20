#!/usr/bin/env node
/**
 * Makes the contracts the source of truth.
 *
 * Every `suggest` becomes the `token`: a decision taken in the contract, no
 * longer waiting for Figma to bind it. Then `source.frozenAt` is set, and from
 * that date bin/build-contracts.mjs will not overwrite the contract from Figma.
 *
 *   node bin/freeze.mjs           dry run: report what would change
 *   node bin/freeze.mjs --apply   write it
 */
import { read, write, ids } from './lib/contract-io.mjs'
import { loadTokens } from './lib/kit.mjs'

const apply = process.argv.includes('--apply')
const today = new Date().toISOString().slice(0, 10)
const { resolves } = loadTokens()

let accepted = 0, missing = 0, frozen = 0
const accept = (styles, id, where) => {
  for (const [prop, v] of Object.entries(styles ?? {})) {
    if (!v.suggest) continue
    // A suggestion for a token that does not exist yet stays a suggestion:
    // accepting it would assert a variable no stylesheet defines.
    if (!resolves(v.suggest)) { missing++; console.log(`  keep  ${id} ${where}.${prop}: ${v.suggest} is not in tokens.css yet`); continue }
    v.token = v.suggest
    delete v.suggest
    accepted++
  }
}

for (const id of ids()) {
  const c = read(id)
  if (c.source.frozenAt) continue
  for (const [part, e] of Object.entries(c.elements ?? {})) accept(e.styles, id, part)
  for (const v of c.variants ?? []) for (const [part, s] of Object.entries(v.elements ?? {})) accept(s, id, part)
  c.source.frozenAt = today
  frozen++
  if (apply) write(c)
}

console.log(`${apply ? '' : '[dry run] '}${accepted} suggestions accepted as tokens, ${missing} kept, ${frozen} contracts frozen at ${today}`)
if (!apply) console.log('Run with --apply to write.')

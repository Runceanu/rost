#!/usr/bin/env node
/**
 * Auditing a codebase against the design system.
 *
 * Three checks, each for a failure that ships silently:
 *
 *  1. UNDEFINED VARS. `var(--gap-7xlarge)` with no such token resolves to
 *     nothing — no error, no warning, the rule just does not apply. On the portfolio site
 *     this produced sections with no padding at all and looked like a layout
 *     bug rather than a typo.
 *  2. RAW HEX. A literal colour cannot follow a theme or a token retune, and
 *     will not show up in any token audit later.
 *  3. UNKNOWN TOKENS. A local token with no counterpart in the Figma variable
 *     registry is either a name invented in code, or a real design decision
 *     that never made it back into the kit. Both are worth knowing.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { homedir } from 'node:os'

const here = new URL('.', import.meta.url).pathname
const registry = JSON.parse(readFileSync(join(here, '../registry/figma-variables.json'), 'utf8'))
const kitPaths = new Set(registry.paths.map((p) => p.replace(/[/\-\s]/g, '').toLowerCase()))

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(e)) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(css|jsx?|tsx?)$/.test(p)) out.push(p)
  }
  return out
}

const ALLOW_HEX = /#(fff|ffffff|000|000000|0000|transparent)\b/i

function audit(root) {
  const files = walk(root)
  const defined = new Set()
  for (const f of files.filter((f) => f.endsWith('.css'))) {
    // Comments stripped first, or a comment between two declarations hides the
    // second. Anchored on { or ; so a modifier class (.x--selected::before)
    // is not mistaken for a token definition.
    const body = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const m of body.matchAll(/[{;]\s*(--[\w-]+)\s*:/g)) defined.add(m[1])
  }

  const undef = [], hex = [], unknown = new Map()
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    const rel = relative(root, f)
    src.split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
      for (const m of line.matchAll(/var\(\s*(--[\w-]+)\s*(,[^)]*)?\)/g)) {
        if (!defined.has(m[1]) && !m[2]) undef.push({ file: rel, line: i + 1, token: m[1] })
      }
      if (f.endsWith('.css')) {
        for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
          if (!ALLOW_HEX.test(m[0]) && !/^\s*--/.test(line)) hex.push({ file: rel, line: i + 1, value: m[0] })
        }
      }
    })
  }
  for (const d of defined) {
    const flat = d.slice(2).replace(/[/\-\s]/g, '').toLowerCase()
    if (!kitPaths.has(flat)) unknown.set(d, (unknown.get(d) ?? 0) + 1)
  }
  return { root, files: files.length, defined: defined.size, undef, hex, unknown: [...unknown.keys()].sort() }
}

const targets = (process.argv.slice(2).length ? process.argv.slice(2) : ['.'])
  .map((p) => resolve(p.replace(/^~/, homedir())))

let failed = false
for (const t of targets) {
  const r = audit(t)
  console.log(`\n\x1b[1m${r.root}\x1b[0m  ${r.files} files, ${r.defined} tokens defined`)

  console.log(`\n  UNDEFINED VARS (resolve to nothing, silently) — ${r.undef.length}`)
  for (const u of r.undef.slice(0, 20)) console.log(`    ${u.file}:${u.line}  ${u.token}`)
  if (r.undef.length > 20) console.log(`    …and ${r.undef.length - 20} more`)
  if (r.undef.length) failed = true

  console.log(`\n  RAW HEX outside token definitions — ${r.hex.length}`)
  const byVal = {}
  for (const h of r.hex) (byVal[h.value] ??= []).push(`${h.file}:${h.line}`)
  for (const [v, at] of Object.entries(byVal).slice(0, 15)) console.log(`    ${v}  ${at.slice(0, 3).join(', ')}${at.length > 3 ? ` +${at.length - 3}` : ''}`)

  console.log(`\n  TOKENS NOT IN THE FIGMA REGISTRY — ${r.unknown.length}`)
  for (const u of r.unknown.slice(0, 25)) console.log(`    ${u}`)
  if (r.unknown.length > 25) console.log(`    …and ${r.unknown.length - 25} more`)
}
process.exit(failed ? 1 : 0)

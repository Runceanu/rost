#!/usr/bin/env node
/**
 * Auditing a codebase against the design system.
 *
 * Three checks, each for a failure that ships silently:
 *
 *  1. UNDEFINED VARS. `var(--gap-7xlarge)` with no such token resolves to
 *     nothing: no error, no warning, the rule just does not apply. On the portfolio site
 *     this produced sections with no padding at all and looked like a layout
 *     bug rather than a typo.
 *  2. RAW HEX. A literal colour cannot follow a theme or a token retune, and
 *     will not show up in any token audit later.
 *  3. UNKNOWN TOKENS. A local token that's neither a Figma variable nor one of
 *     Rost's own tokens is either a name invented in code, or a real design decision
 *     that never made it back into the kit. Both are worth knowing.
 *
 * Undefined vars always fail the run. With --strict, raw hex and unknown
 * tokens fail it too: for an app that's already clean and should stay so.
 *
 *   node bin/audit.mjs [--strict] <app-dir> [<app-dir>...]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const registry = JSON.parse(readFileSync(join(here, '../registry/figma-variables.json'), 'utf8'))
// The kit's names: every Figma variable, plus the tokens Rost made in code
// (the effects, the shadow, aliases). Both are real; neither is an invention.
const rostTokens = [...readFileSync(join(here, '../tokens/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1].slice(2))
const kitPaths = new Set([...registry.paths, ...rostTokens].map((p) => p.replace(/[/\-\s]/g, '').toLowerCase()))

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(e)) continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(s?css|jsx?|tsx?|astro|svelte|vue)$/.test(p)) out.push(p)
  }
  return out
}

const ALLOW_HEX = /#(fff|ffffff|000|000000|0000)\b/i
// Block comments blanked out, line breaks kept, so line numbers stay right.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

function audit(root) {
  const files = walk(root)
  const defined = new Set()
  for (const f of files.filter((f) => /\.s?css$/.test(f))) {
    // Comments stripped first, or a comment between two declarations hides the
    // second. Anchored on { or ; so a modifier class (.x--selected::before)
    // is not mistaken for a token definition.
    const body = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const m of body.matchAll(/[{;]\s*(--[\w-]+)\s*:/g)) defined.add(m[1])
  }

  const undef = [], hex = []
  for (const f of files) {
    const src = stripComments(readFileSync(f, 'utf8'))
    const rel = relative(root, f)
    src.split('\n').forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return
      for (const m of line.matchAll(/var\(\s*(--[\w-]+)\s*(,[^)]*)?\)/g)) {
        if (!defined.has(m[1]) && !m[2]) undef.push({ file: rel, line: i + 1, token: m[1] })
      }
      if (/\.s?css$/.test(f)) {
        for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
          if (!ALLOW_HEX.test(m[0]) && !/^\s*--/.test(line)) hex.push({ file: rel, line: i + 1, value: m[0] })
        }
      }
    })
  }
  const unknown = [...defined].filter((d) => !kitPaths.has(d.slice(2).replace(/[/\-\s]/g, '').toLowerCase())).sort()
  return { root, files: files.length, defined: defined.size, undef, hex, unknown }
}

const args = process.argv.slice(2)
const strict = args.includes('--strict')
const paths = args.filter((a) => a !== '--strict')
const targets = (paths.length ? paths : ['.'])
  .map((p) => resolve(p.replace(/^~/, homedir())))

let failed = false
for (const t of targets) {
  const r = audit(t)
  console.log(`\n\x1b[1m${r.root}\x1b[0m  ${r.files} files, ${r.defined} tokens defined`)

  console.log(`\n  UNDEFINED VARS (resolve to nothing, silently): ${r.undef.length}`)
  for (const u of r.undef.slice(0, 20)) console.log(`    ${u.file}:${u.line}  ${u.token}`)
  if (r.undef.length > 20) console.log(`    …and ${r.undef.length - 20} more`)
  if (r.undef.length) failed = true
  if (strict && (r.hex.length || r.unknown.length)) failed = true

  console.log(`\n  RAW HEX outside token definitions: ${r.hex.length}`)
  const byVal = {}
  for (const h of r.hex) (byVal[h.value] ??= []).push(`${h.file}:${h.line}`)
  for (const [v, at] of Object.entries(byVal).slice(0, 15)) console.log(`    ${v}  ${at.slice(0, 3).join(', ')}${at.length > 3 ? ` +${at.length - 3}` : ''}`)

  console.log(`\n  TOKEN NAMES THE KIT DOESN'T HAVE: ${r.unknown.length}`)
  for (const u of r.unknown.slice(0, 25)) console.log(`    ${u}`)
  if (r.unknown.length > 25) console.log(`    …and ${r.unknown.length - 25} more`)
}
process.exit(failed ? 1 : 0)

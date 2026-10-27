#!/usr/bin/env node
/**
 * Copies Rost's components into an app, the way shadcn does it: the app owns
 * the files, and running this again brings them up to date.
 *
 *   node bin/add.mjs <app-dir> badge button        add these (and what they import)
 *   node bin/add.mjs <app-dir>                     update every one the app already has
 *   node bin/add.mjs <app-dir> --tokens src/styles/tokens.css
 *                                                  also refresh the app's copy of tokens.css
 *
 * In the app it writes:
 *   src/rost/<id>/            the component, its CSS and icons (not the fixtures)
 *   src/rost/conform.ts       the check, so the app's tests can run it
 *   contracts/rost/<id>.contract.yaml   the contract, the same file as Rost's
 *   src/rost/README.md        which Rost commit the copies come from
 *
 * Copies are replaced whole, so a file Rost removed goes from the app too.
 * Nothing is committed in the app: that's the app's call.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, cpSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rost = fileURLToPath(new URL('..', import.meta.url))
const args = process.argv.slice(2)
const tokensAt = args.includes('--tokens') ? args[args.indexOf('--tokens') + 1] : null
const rest = args.filter((a, i) => a !== '--tokens' && args[i - 1] !== '--tokens')
const [appArg, ...asked] = rest
if (!appArg) { console.log('Usage: node bin/add.mjs <app-dir> [component ...] [--tokens <path in app>]'); process.exit(1) }
const app = resolve(appArg.replace(/^~/, homedir()))
if (!existsSync(app)) { console.log(`No such app folder: ${app}`); process.exit(1) }

const built = readdirSync(join(rost, 'src/components')).filter((d) => statSync(join(rost, 'src/components', d)).isDirectory())
const inApp = existsSync(join(app, 'src/rost')) ? readdirSync(join(app, 'src/rost')).filter((d) => built.includes(d)) : []
const wanted = asked.length ? asked : inApp
const unknown = wanted.filter((id) => !built.includes(id))
if (unknown.length) { console.log(`Not built in Rost: ${unknown.join(', ')}. Built: ${built.join(', ')}`); process.exit(1) }
if (!wanted.length) { console.log('Nothing to add: name a component, or run it on an app that already has some.'); process.exit(1) }

// A component that imports another (`../badge/Badge`) brings it along.
const needs = (id) => [...new Set(readdirSync(join(rost, 'src/components', id))
  .filter((f) => f.endsWith('.tsx') && !f.endsWith('.fixtures.tsx'))
  .flatMap((f) => [...readFileSync(join(rost, 'src/components', id, f), 'utf8').matchAll(/from '\.\.\/([\w-]+)\//g)].map((m) => m[1])))]
const all = new Set()
const visit = (id) => { if (all.has(id)) return; all.add(id); needs(id).forEach(visit) }
wanted.forEach(visit)

const commit = execSync('git rev-parse --short HEAD', { cwd: rost }).toString().trim()
const dirty = execSync('git status --porcelain -- src/components src/conform.ts contracts tokens', { cwd: rost }).toString().trim()
const from = dirty ? `${commit}, plus uncommitted changes` : commit

const changed = []
const write = (path, text) => {
  const before = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (before !== text) { mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, text); changed.push(path.slice(app.length + 1)) }
}
const snapshot = (dir) => existsSync(dir) ? readdirSync(dir, { recursive: true }).filter((f) => statSync(join(dir, f)).isFile()).sort().map((f) => [f, readFileSync(join(dir, f), 'utf8')]) : []

for (const id of [...all].sort()) {
  const target = join(app, 'src/rost', id)
  const before = JSON.stringify(snapshot(target))
  rmSync(target, { recursive: true, force: true })
  cpSync(join(rost, 'src/components', id), target, { recursive: true, filter: (src) => !src.endsWith('.fixtures.tsx') })
  if (JSON.stringify(snapshot(target)) !== before) changed.push(`src/rost/${id}/`)
  write(join(app, 'contracts/rost', `${id}.contract.yaml`), readFileSync(join(rost, 'contracts', `${id}.contract.yaml`), 'utf8'))
  // Until 2026-10-26 the contracts went in as JSON. That copy goes.
  const json = join(app, 'contracts/rost', `${id}.contract.json`)
  if (existsSync(json)) { rmSync(json); changed.push(`contracts/rost/${id}.contract.json (removed)`) }
}
write(join(app, 'src/rost/conform.ts'), readFileSync(join(rost, 'src/conform.ts'), 'utf8'))
if (tokensAt) write(join(app, tokensAt), readFileSync(join(rost, 'tokens/tokens.css'), 'utf8'))

const names = [...new Set([...inApp, ...all])].sort()
write(join(app, 'src/rost/README.md'), `# Rost, copied in

These are Rost's own components, copied from https://github.com/Runceanu/rost at \`${from}\`:
${names.map((n) => `\`${n}\``).join(', ')}, with their CSS and icons, and \`conform.ts\`, the check that keeps them honest.
\`contracts/rost/\` holds the matching contracts, the same YAML files as Rost's.

Don't edit these files here. Change them in Rost, then copy them again from the Rost repo:

    npm run add -- <this app's folder>
`)

console.log(`Rost ${from} -> ${app}`)
console.log(`  components: ${[...all].sort().join(', ')}${[...all].length > wanted.length ? ` (${[...all].filter((i) => !wanted.includes(i)).join(', ')} came along as imports)` : ''}`)
console.log(changed.length ? `  changed:\n${changed.map((c) => `    ${c}`).join('\n')}` : '  already up to date')

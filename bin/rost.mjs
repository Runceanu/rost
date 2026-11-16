#!/usr/bin/env node
/**
 * Rost's own installer. It reads the registry on rost.build and copies the
 * components into your app, the way shadcn does: the files are yours after
 * that. Any app works, with or without shadcn or Tailwind.
 *
 *   npx rost add button input       add these, and what they need
 *   npx rost add                    update every component the app already has
 *   npx rost list                   what's in the registry
 *
 *   --cwd <dir>        the app (default: here)
 *   --registry <url>   somewhere other than https://rost.build/r (a folder works too)
 *
 * Components land in src/rost/<id>/ and their contracts in contracts/rost/.
 * Running it again replaces them with the current version.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'

const args = process.argv.slice(2)
const opt = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args.splice(i, 2)[1] }
const cwd = resolve(opt('--cwd', '.'))
const registry = opt('--registry', 'https://rost.build/r').replace(/\/$/, '')
const [command, ...names] = args

const isUrl = /^https?:/.test(registry)
const load = async (ref) => {
  // An item names its dependencies by full URL. Keep only the name, so a
  // local or staging registry serves its own copy of each one.
  const name = ref.replace(/^.*\//, '').replace(/\.json$/, '')
  if (!isUrl) return JSON.parse(readFileSync(join(registry, `${name}.json`), 'utf8'))
  const res = await fetch(`${registry}/${name}.json`)
  if (!res.ok) throw new Error(res.status === 404 ? `"${name}" isn't in Rost. \`npx rost list\` says what is.` : `${registry}/${name}.json: ${res.status}`)
  return res.json()
}

if (command === 'list') {
  const index = isUrl ? await (await fetch(`${registry}/registry.json`)).json() : JSON.parse(readFileSync(join(registry, 'registry.json'), 'utf8'))
  const width = Math.max(...index.items.map((i) => i.name.length))
  for (const i of index.items) console.log(`${i.name.padEnd(width)}  ${i.description.split('. ')[0].replace(/\.$/, '')}`)
  process.exit(0)
}

if (command !== 'add') {
  console.log('Usage: npx rost add [component ...] [--cwd <app>] [--registry <url>]\n       npx rost list')
  process.exit(command ? 1 : 0)
}

// With no names, update what's there.
const had = existsSync(join(cwd, 'src/rost')) ? readdirSync(join(cwd, 'src/rost')).filter((d) => statSync(join(cwd, 'src/rost', d)).isDirectory()) : []
const wanted = names.length ? names : had
if (!wanted.length) { console.log('Name a component to add, like `npx rost add button`.'); process.exit(1) }

const items = new Map()
const visit = async (ref) => {
  const item = await load(ref)
  if (items.has(item.name)) return
  items.set(item.name, item)
  for (const dep of item.registryDependencies ?? []) await visit(dep)
}
try { for (const n of wanted) await visit(n) } catch (e) { console.log(e.message); process.exit(1) }

const report = { created: [], updated: [], same: 0 }
for (const item of items.values()) {
  for (const f of item.files) {
    const path = join(cwd, f.target.replace(/^~\//, ''))
    if (relative(cwd, path).startsWith('..')) throw new Error(`${item.name} wants to write outside the app: ${f.target}`)
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (before === f.content) { report.same++; continue }
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, f.content)
    report[before === null ? 'created' : 'updated'].push(relative(cwd, path))
  }
}

const extra = [...items.keys()].filter((n) => n !== 'rost' && !wanted.includes(n))
console.log(`Rost: ${wanted.join(', ')}${extra.length ? ` (with ${extra.join(', ')})` : ''}`)
for (const k of ['created', 'updated']) if (report[k].length) console.log(`  ${k}:\n${report[k].map((p) => `    ${p}`).join('\n')}`)
if (!report.created.length && !report.updated.length) console.log('  already up to date')
if (report.created.some((p) => p.endsWith('tokens.css'))) console.log("\nImport these once, at the root of the app:\n  import './rost/fonts.css'\n  import './rost/tokens.css'")

#!/usr/bin/env node
/**
 * Checks the built site before it goes live. For now one thing: no link
 * inside a link. That isn't HTML, and the browser splits the outer link
 * apart when it reads the page. A Breadcrumb inside a home page card did
 * exactly that and stretched a whole row of the grid.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = new URL('../web/dist/', import.meta.url).pathname
const pages = []
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) pages.push(p) } }
walk(dist)

const bad = pages.filter((p) => {
  let depth = 0
  for (const m of readFileSync(p, 'utf8').matchAll(/<a\b|<\/a>/g)) {
    depth += m[0] === '</a>' ? -1 : 1
    if (depth > 1) return true
  }
  return false
})
if (bad.length) {
  console.log(`A link inside a link on ${bad.length} page(s):\n${bad.map((p) => `  ${p.slice(dist.length)}`).join('\n')}`)
  process.exit(1)
}
console.log(`site: ${pages.length} pages, no link inside a link`)

#!/usr/bin/env node
/**
 * Reads every variant of the named components from Figma, one read per
 * variant, so the variant name says which branch of the code applies.
 * A file that's already there is skipped; delete it to read it again.
 *
 *   node bin/extract-variants.mjs [component ...]   (default: every set in the registry)
 */
import { call } from './figma.mjs'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// Each set's variants, by component id: { badge: [{ nodeId, name, width, height }, …], … }
const sets = JSON.parse(readFileSync(new URL('../registry/component-sets.json', import.meta.url), 'utf8'))
const nodes = Object.fromEntries(Object.entries(sets).filter(([, s]) => s.variants).map(([id, s]) => [id, s.variants]))
const CORE = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(nodes)
let ok = 0, fail = 0
for (const comp of CORE) {
  for (const v of nodes[comp] ?? []) {
    const safe = `${comp}__${v.nodeId.replace(':', '-')}`
    const out = new URL(`../raw/variants/${safe}.txt`, import.meta.url)
    if (existsSync(out)) { ok++; continue }
    try {
      const text = await call('get_design_context', { nodeId: v.nodeId, clientFrameworks: 'react', clientLanguages: 'typescript,css', skillNames: 'figma-design-to-code' })
      writeFileSync(out, `/* ${comp} | ${v.name} | ${v.nodeId} | ${v.width}x${v.height} */\n${text}`)
      ok++
    } catch (e) { fail++; console.log(`  FAIL ${comp} ${v.nodeId}: ${String(e).slice(0,80)}`) }
  }
  console.log(`  ${comp.padEnd(15)} done`)
}
console.log(`\n${ok} variants read, ${fail} failed`)

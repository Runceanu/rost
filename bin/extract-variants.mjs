#!/usr/bin/env node
/** One read per variant: unconditional code, no ternaries to misparse. */
import { call } from './figma.mjs'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const nodes = JSON.parse(readFileSync(new URL('../registry/variant-nodes.json', import.meta.url), 'utf8'))
const CORE = ['badge','pill-button','button','icon-button','input','toggle','inline-banner','chips','tags','menu']
let ok = 0, fail = 0
for (const comp of CORE) {
  for (const v of nodes[comp] ?? []) {
    const safe = `${comp}__${v.nodeId.replace(':', '-')}`
    const out = new URL(`../raw/variants/${safe}.txt`, import.meta.url)
    if (existsSync(out)) { ok++; continue }
    try {
      const text = await call('get_design_context', { nodeId: v.nodeId, clientFrameworks: 'react', clientLanguages: 'typescript,css' })
      writeFileSync(out, `/* ${comp} | ${v.name} | ${v.nodeId} | ${v.width}x${v.height} */\n${text}`)
      ok++
    } catch (e) { fail++; console.log(`  FAIL ${comp} ${v.nodeId}: ${String(e).slice(0,80)}`) }
  }
  console.log(`  ${comp.padEnd(15)} done`)
}
console.log(`\n${ok} variants read, ${fail} failed`)

#!/usr/bin/env node
/**
 * Captures Figma's own render of every variant, the visual target the coded
 * components are diffed against. One PNG per variant node, rendered in
 * isolation, at Figma's 1x export scale.
 *
 *   node bin/capture-baseline.mjs [component ...]   (default: every set in the registry)
 */
import { callContent } from './figma.mjs'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

const nodes = JSON.parse(readFileSync(new URL('../registry/variant-nodes.json', import.meta.url), 'utf8'))
const comps = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(nodes)
const manifest = {}
let ok = 0, fail = 0, skipped = 0

for (const comp of comps) {
  const dir = new URL(`../baseline/${comp}/`, import.meta.url)
  mkdirSync(dir, { recursive: true })
  manifest[comp] = []
  for (const v of nodes[comp] ?? []) {
    const file = `${v.nodeId.replace(':', '-')}.png`
    manifest[comp].push({ nodeId: v.nodeId, name: v.name, file, width: v.width, height: v.height })
    if (existsSync(new URL(file, dir))) { skipped++; continue }
    try {
      const img = (await callContent('get_screenshot', { nodeId: v.nodeId, contentsOnly: true })).find((c) => c.type === 'image')
      if (!img) throw new Error('no image returned')
      writeFileSync(new URL(file, dir), Buffer.from(img.data, 'base64'))
      ok++
    } catch (e) { fail++; console.log(`  FAIL ${comp} ${v.nodeId}: ${String(e).slice(0, 80)}`) }
  }
  console.log(`  ${comp.padEnd(18)} ${manifest[comp].length}`)
}
writeFileSync(new URL('../baseline/manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n')
console.log(`\n${ok} captured, ${skipped} already present, ${fail} failed`)

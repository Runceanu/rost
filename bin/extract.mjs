#!/usr/bin/env node
/** Pulls the full variant matrix for each component SET (not a lone variant). */
import { call } from './figma.mjs'
import { writeFileSync, existsSync } from 'node:fs'

const SETS = {
  badge: '139:395', 'pill-button': '20:14', button: '39:38', 'icon-button': '93:587',
  input: '240:273', toggle: '168:1149', 'inline-banner': '205:614', chips: '139:317',
  tags: '91:362', menu: '41:259', carousel: '157:302', projects: '100:185',
  thumbs: '109:79', testimonials: '144:67', divider: '39:111', icons: '92:15',
}

for (const [slug, node] of Object.entries(SETS)) {
  for (const tool of ['get_design_context', 'get_variable_defs']) {
    const out = new URL(`../raw/${slug}.${tool}.txt`, import.meta.url)
    if (existsSync(out)) continue
    try {
      const text = await call(tool, { nodeId: node, clientFrameworks: 'react', clientLanguages: 'typescript,css' })
      writeFileSync(out, text)
      console.log(`  ok   ${slug.padEnd(14)} ${tool.padEnd(20)} ${String(text.length).padStart(6)} chars  node ${node}`)
    } catch (e) {
      console.log(`  FAIL ${slug} ${tool}: ${String(e).slice(0, 100)}`)
    }
  }
}

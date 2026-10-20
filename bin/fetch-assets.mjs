#!/usr/bin/env node
/**
 * Saves every image a Figma read points at into assets/figma/.
 *
 * Figma serves these from the desktop app (localhost:3845) only for a while
 * after the read that produced them, so run this straight after reading.
 * An expired or failed asset comes back as a short text error with a 200,
 * which is how 47 broken "SVGs" got saved once. So every file is checked:
 * an SVG has to contain <svg, a PNG has to start with the PNG signature.
 *
 *   node bin/fetch-assets.mjs [component ...]   (default: every read in raw/variants)
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'

const RAW = new URL('../raw/variants/', import.meta.url)
const OUT = new URL('../assets/figma/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const only = process.argv.slice(2)
const files = readdirSync(RAW).filter((f) => f.endsWith('.txt') && (!only.length || only.includes(f.split('__')[0])))

// Figma's own instructions quote an example asset URL; it isn't a real image.
const EXAMPLE = '10c13ac1a228a365cb98a0064b1d5afbc84887b2'
// These sets show real people and a client's work. Their pictures (PNGs) go
// to assets/private/ (gitignored), never into the public repo. Their SVG
// icons are ordinary and stay with the rest.
const PRIVATE = ['testimonials-pics', 'thumbs']
const urls = new Map()
for (const f of files) for (const m of readFileSync(new URL(f, RAW), 'utf8').matchAll(/http:\/\/localhost:3845\/assets\/([a-f0-9]+)\.(svg|png)/g))
  if (m[1] !== EXAMPLE) urls.set(m[0], urls.get(m[0]) || (m[2] === 'png' && PRIVATE.includes(f.split('__')[0])))
const PRIVATE_OUT = new URL('../assets/private/figma/', import.meta.url)
mkdirSync(PRIVATE_OUT, { recursive: true })

const valid = (buf, ext) => ext === 'svg' ? buf.toString('utf8', 0, 2048).includes('<svg') : buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
let saved = 0, kept = 0, bad = []
for (const [url, isPrivate] of urls) {
  const name = url.split('/').pop()
  const ext = name.split('.').pop()
  const dest = new URL(name, isPrivate ? PRIVATE_OUT : OUT)
  if (existsSync(dest) && valid(readFileSync(dest), ext)) { kept++; continue }
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    if (!valid(buf, ext)) { bad.push(`${name}: ${buf.toString('utf8', 0, 60).trim()}`); continue }
    writeFileSync(dest, buf)
    saved++
  } catch (e) { bad.push(`${name}: ${e.message}`) }
}
console.log(`${saved} saved, ${kept} already here, ${bad.length} not available`)
for (const b of bad.slice(0, 10)) console.log(`  ${b}`)
if (bad.length > 10) console.log(`  …and ${bad.length - 10} more`)
process.exitCode = bad.length ? 1 : 0

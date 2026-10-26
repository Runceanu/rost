#!/usr/bin/env node
/**
 * Renders every fixture of a component in Chromium and compares it, pixel by
 * pixel, with Figma's own screenshot of the same node (baseline/).
 *
 *   node bin/visual-test.mjs <id> [<id> ...]
 *
 * Diffs land in test-results/visual/<id>/ (red = different). Two numbers per
 * variant: the exact share of pixels that differ, and the share that still
 * differ when each pixel may match its Figma neighbour up to 1px away. Figma
 * and Chrome place a line of text up to a pixel apart and never anti-alias it
 * the same, so the second number is the one that decides. A variant passes when
 * its size is exact, at most MAX_DIFF of its pixels differ beyond 1px, and no
 * clump of them is bigger than MAX_CLUMP: text edges differ in specks, a
 * missing part in one piece.
 *
 * Figma renders each component on the page background (#060805,
 * non-interactive/background/primary), so the test does too.
 *
 * A fixture can ask for two more things. `force` holds pseudo-classes
 * (hover, active, focus-visible) put on the component's root through the
 * DevTools protocol, the way DevTools' own :hov panel does: interaction states
 * are the browser's, not props. `mask` lists boxes, in Figma's pixels, that
 * aren't compared, for a sample text that can't be published.
 *
 * Font: the same General Sans Variable that Figma renders with, from
 * ROST_FONT (default ~/Library/Fonts/GeneralSans-Variable.ttf), with the
 * metric overrides from tokens/fonts.css, the same ones the apps use. Smoothing
 * matches both apps (-webkit-font-smoothing: antialiased).
 */
import { build } from 'esbuild'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { extname } from 'node:path'

// Measured on InlineBanner (2026-10-19): with everything else exact, Figma and
// Chrome still disagree on 2.0-2.4% of pixels at letter edges, beyond 1px.
// A missing icon or a wrong colour lands well above this line.
const MAX_DIFF = 0.025
// And no clump of touching pixels that differ bigger than this. Measured on
// 2026-10-21: text in passing variants clumps up to 29px; IconButton with its
// arrow missing clumps at 34 to 54px, yet stayed under MAX_DIFF. A disabled
// variant is too faint for either measure to see a missing part.
const MAX_CLUMP = 32
// How close two pixels' colours must be (sum of RGB differences) to count as
// the same: room for anti-aliasing, far below a wrong colour.
const CLOSE = 96
// Time for the page to settle after fonts load, and how much the side by sides are zoomed.
const SETTLE_MS = 100
const ZOOM = 6
const root = fileURLToPath(new URL('../', import.meta.url))
const font = process.env.ROST_FONT ?? join(homedir(), 'Library/Fonts/GeneralSans-Variable.ttf')
if (!existsSync(font)) { console.log(`General Sans Variable not found at ${font}. Set ROST_FONT.`); process.exit(1) }
// Rost's own placement of the font (tokens/fonts.css): the same overrides on
// the local file. ROST_METRICS=ascent,descent,gap tries others, in percent.
const metrics = process.env.ROST_METRICS
  ? ((a, d, g) => ` ascent-override: ${a}%; descent-override: ${d}%; line-gap-override: ${g}%;`)(...process.env.ROST_METRICS.split(','))
  : ' ' + (readFileSync(join(root, 'tokens/fonts.css'), 'utf8').match(/(?:ascent|descent|line-gap)-override:[^;]+;/g) ?? []).join(' ')
const manifest = JSON.parse(readFileSync(join(root, 'baseline/manifest.json'), 'utf8'))
const ids = process.argv.slice(2)
if (!ids.length) { console.log('Usage: node bin/visual-test.mjs <id> [<id> ...]'); process.exit(1) }

/**
 * Pixels with no close match on the other side within one pixel, counted in
 * both directions (Figma against ours, ours against Figma), so a missing part
 * shows up as well as an extra one. "Close" allows for anti-aliasing: a wrong
 * colour (say #999 instead of #d3d9d5) is far outside it.
 */
function beyondOnePixel(a, b) {
  const close = (p, i, q, j) => Math.abs(p.data[i] - q.data[j]) + Math.abs(p.data[i + 1] - q.data[j + 1]) + Math.abs(p.data[i + 2] - q.data[j + 2]) <= CLOSE
  const oneWay = (p, q) => {
    const miss = new Uint8Array(p.width * p.height)
    let n = 0
    for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
      const j = (y * p.width + x) * 4
      let hit = false
      for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1 && !hit; dx++) {
        const yy = y + dy, xx = x + dx
        if (yy >= 0 && yy < p.height && xx >= 0 && xx < p.width && close(q, (yy * p.width + xx) * 4, p, j)) hit = true
      }
      if (!hit) { n++; miss[y * p.width + x] = 1 }
    }
    return { n, miss }
  }
  const ab = oneWay(a, b), ba = oneWay(b, a)
  const miss = ab.miss.map((v, i) => v | ba.miss[i])
  return { n: Math.max(ab.n, ba.n), clump: largestClump(miss, a.width, a.height) }
}

/**
 * The biggest group of touching pixels that differ. Text edges differ in
 * specks of one or two pixels; a missing or wrong part differs in a clump.
 * The share alone missed IconButton's arrow when it didn't render at all.
 */
function largestClump(miss, w, h) {
  const seen = new Uint8Array(miss.length)
  let best = 0
  for (let start = 0; start < miss.length; start++) {
    if (!miss[start] || seen[start]) continue
    let size = 0
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i - x) / w
      size++
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy, k = yy * w + xx
        if (xx >= 0 && xx < w && yy >= 0 && yy < h && miss[k] && !seen[k]) { seen[k] = 1; stack.push(k) }
      }
    }
    best = Math.max(best, size)
  }
  return best
}

/** Figma | ours | difference, scaled up with hard pixels so you can see them. */
function sideBySide(images, scale) {
  const gap = 4 * scale, w = images.reduce((s, i) => s + i.width * scale, 0) + gap * (images.length - 1)
  const h = Math.max(...images.map((i) => i.height)) * scale
  const out = new PNG({ width: w, height: h, fill: true })
  out.data.fill(255)
  let ox = 0
  for (const img of images) {
    for (let y = 0; y < img.height * scale; y++) for (let x = 0; x < img.width * scale; x++) {
      const s = ((Math.floor(y / scale) * img.width) + Math.floor(x / scale)) * 4, d = (y * w + ox + x) * 4
      out.data[d] = img.data[s]; out.data[d + 1] = img.data[s + 1]; out.data[d + 2] = img.data[s + 2]; out.data[d + 3] = 255
    }
    ox += img.width * scale + gap
  }
  return out
}

// Components import icons as `./x.svg?url` (what Vite and Astro expect). esbuild
// doesn't know the suffix, so drop it and let the file loader give the URL.
const svgUrl = {
  name: 'svg-url',
  setup(b) { b.onResolve({ filter: /\.svg\?url$/ }, (a) => ({ path: join(a.resolveDir, a.path.replace(/\?url$/, '')) })) },
}

// Pages are served over http, not opened as files: a browser won't apply a
// CSS mask (IconButton's arrow) from a file:// URL, and the site is http too.
// `/repo/...` is this repo, `/font` the font.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' }
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = path === '/font' ? font : path.startsWith('/repo/') ? join(root, path.slice(6)) : null
  if (!file || !file.startsWith(root) && file !== font || !existsSync(file)) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch()
let failed = 0
let compared = 0
// What didn't match, per component, kept in the repo so rost.build can say so.
// Only the components tested this run are replaced.
const resultsPath = join(root, 'baseline/results.json')
const results = existsSync(resultsPath) ? JSON.parse(readFileSync(resultsPath, 'utf8')) : {}

for (const id of ids) {
  const work = join(root, 'test-results/visual', id)
  rmSync(work, { recursive: true, force: true })
  mkdirSync(work, { recursive: true })
  const failing = (results[id] = [])

  // A tiny page: every fixture in its own box, nothing else.
  writeFileSync(join(work, 'entry.tsx'), `
    import { createRoot } from 'react-dom/client'
    import { fixtures } from '${join(root, 'src/components', id, `${id}.fixtures.tsx`)}'
    createRoot(document.getElementById('root')).render(
      <>{fixtures.map((f) => <div key={f.node} data-node={f.node} data-force={(f.force ?? []).join(' ')} data-force-on={f.forceOn ?? ''} data-mask={JSON.stringify(f.mask ?? [])} style={{ margin: 8 }}>{f.element}</div>)}</>
    )`)
  await build({ entryPoints: [join(work, 'entry.tsx')], bundle: true, outdir: work, jsx: 'automatic', logLevel: 'error', loader: { '.svg': 'file' }, plugins: [svgUrl] })
  const face = `@font-face { font-family: 'General Sans Variable'; font-weight: 200 700; src: url('${origin}/font') format('truetype');${metrics} }`
  writeFileSync(join(work, 'index.html'), `<!doctype html><meta charset="utf-8">
    <link rel="stylesheet" href="${origin}/repo/tokens/tokens.css">
    <style>${face} body { margin: 0; background: var(--non-interactive-background-primary); -webkit-font-smoothing: antialiased; }</style>
    <link rel="stylesheet" href="entry.css"><div id="root"></div><script src="entry.js"></script>`)

  const page = await browser.newPage({ deviceScaleFactor: 1 })
  await page.goto(`${origin}/repo/${join('test-results/visual', id, 'index.html')}`)
  await page.evaluate(() => document.fonts.ready)
  // Figma rounds a component that hugs its content up to whole pixels: Chip
  // is 43px there and 42.4px in Chrome, with its text centred in the extra.
  // It does that to every instance inside too (each Tab in a Tabs bar), so
  // round the innermost Rost roots first, then the ones around them.
  await page.evaluate(() => {
    const roots = [...document.querySelectorAll('[data-node] [class^="rost-"], [data-node] [class*=" rost-"]')]
      .filter((el) => [...el.classList].some((c) => /^rost-[a-z0-9-]+$/.test(c)))
    const depth = (el) => { let d = 0; for (let p = el; p; p = p.parentElement) d++; return d }
    for (const el of roots.sort((a, b) => depth(b) - depth(a))) {
      const r = el.getBoundingClientRect()
      if (!Number.isInteger(r.width)) el.style.width = `${Math.ceil(r.width)}px`
      if (!Number.isInteger(r.height)) el.style.height = `${Math.ceil(r.height)}px`
    }
  })
  await page.waitForTimeout(SETTLE_MS)

  // Forced states go through the DevTools protocol, on the component's root.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const force = async (node, classes, on) => {
    const { root: doc } = await cdp.send('DOM.getDocument', { depth: -1 })
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector: `[data-node="${node}"] ${on || `.rost-${id}`}` })
    if (nodeId) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: classes })
    return nodeId
  }

  console.log(`\n${id}`)
  const byNode = Object.fromEntries((manifest[id] ?? []).map((v) => [v.nodeId, v]))
  const nodes = await page.$$eval('[data-node]', (els) => els.map((e) => e.dataset.node))
  if (!nodes.length) console.log('  no fixtures yet: nothing to compare with')
  compared += nodes.length
  for (const node of nodes) {
    const target = byNode[node]
    const basePath = target && join(root, 'baseline', id, target.file)
    if (!basePath || !existsSync(basePath)) { console.log(`  ?    ${node}  no Figma screenshot to compare with`); compared--; continue }
    const el = await page.$(`[data-node="${node}"] > *`)
    if (!el) { failed++; failing.push({ variant: target.name, why: 'renders nothing' }); console.log(`  FAIL ${target.name.padEnd(30)} rendered nothing`); continue }
    const forced = await page.$eval(`[data-node="${node}"]`, (e) => e.dataset.force.split(' ').filter(Boolean))
    const on = await page.$eval(`[data-node="${node}"]`, (e) => e.dataset.forceOn)
    const forcedOn = forced.length ? await force(node, forced, on) : 0
    if (forced.length) await page.waitForTimeout(SETTLE_MS)
    const shot = PNG.sync.read(await el.screenshot())
    if (forcedOn) await cdp.send('CSS.forcePseudoState', { nodeId: forcedOn, forcedPseudoClasses: [] })
    const base = PNG.sync.read(readFileSync(basePath))
    const label = target.name.padEnd(30)
    if (shot.width !== base.width || shot.height !== base.height) {
      failed++
      failing.push({ variant: target.name, why: `${shot.width}x${shot.height}, Figma's is ${base.width}x${base.height}` })
      console.log(`  FAIL ${label} size ${shot.width}x${shot.height}, Figma ${base.width}x${base.height}`)
      writeFileSync(join(work, `${node.replace(':', '-')}.actual.png`), PNG.sync.write(shot))
      continue
    }
    // A masked box takes Figma's pixels on both sides, so it can't differ.
    for (const m of JSON.parse(await page.$eval(`[data-node="${node}"]`, (e) => e.dataset.mask)))
      for (let y = m.y; y < Math.min(m.y + m.height, base.height); y++)
        for (let x = m.x; x < Math.min(m.x + m.width, base.width); x++) {
          const i = (y * base.width + x) * 4
          for (let k = 0; k < 4; k++) shot.data[i + k] = base.data[i + k]
        }
    const diff = new PNG({ width: base.width, height: base.height })
    const n = pixelmatch(base.data, shot.data, diff.data, base.width, base.height, { threshold: 0.1, includeAA: false })
    const share = n / (base.width * base.height)
    const { n: off, clump } = beyondOnePixel(base, shot)
    const near = off / (base.width * base.height)
    const ok = near <= MAX_DIFF && clump <= MAX_CLUMP
    if (!ok) { failed++; failing.push({ variant: target.name, why: `${(near * 100).toFixed(2)}% of pixels differ from Figma` }) }
    writeFileSync(join(work, `${node.replace(':', '-')}.actual.png`), PNG.sync.write(shot))
    writeFileSync(join(work, `${node.replace(':', '-')}.diff.png`), PNG.sync.write(diff))
    writeFileSync(join(work, `${node.replace(':', '-')}.compare.png`), PNG.sync.write(sideBySide([base, shot, diff], ZOOM)))
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label} ${(near * 100).toFixed(2)}% differ beyond 1px  (${(share * 100).toFixed(2)}% exactly), largest clump ${clump}px`)
  }
  await page.close()
}

await browser.close()
server.close()
for (const id of Object.keys(results)) if (!results[id].length) delete results[id]
writeFileSync(resultsPath, JSON.stringify(results, null, 2) + '\n')
console.log(failed ? `\n${failed} variant(s) don't match Figma yet` : compared ? '\nEverything matches Figma' : '\nNothing was compared')
process.exitCode = failed ? 1 : 0

#!/usr/bin/env node
/**
 * Turns an app's pages into a pen.dev file that imports Rost's library, so
 * the design is drawn with Rost's own tokens: `$rost:<token>`, the same names
 * the app's CSS uses.
 *
 *   node bin/build-pen-pages.mjs <app-dir> <built-site-dir> <out.pen> <route> [<route> ...]
 *
 *   node ../rost/bin/build-pen-pages.mjs . .pen-build design/portfolio.pen / /work /about
 *
 * Each route is rendered in Chromium at 1440 wide, the whole page, with
 * animations stopped, and becomes one frame in the file. The conversion is
 * bin/lib/pen.mjs, the same one that builds design/rost.pen. A photo points
 * at the app's own file (in `public/` when it's there, else a copy next to
 * the .pen file), so the design file doesn't hold a second copy of every image.
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from 'node:fs'
import { join, extname, dirname, relative, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { penTokens, capture, toPen } from './lib/pen.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const [appArg, siteArg, outArg, ...routes] = process.argv.slice(2)
if (!appArg || !siteArg || !outArg || !routes.length) {
  console.log('Usage: node bin/build-pen-pages.mjs <app-dir> <built-site-dir> <out.pen> <route> [<route> ...]')
  process.exit(1)
}
const app = resolve(appArg), site = resolve(app, siteArg), out = resolve(app, outArg)
const WIDTH = 1440
const { kinds } = penTokens(JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')).tokens)
// The library, as the app's file reaches it.
const library = relative(dirname(out), join(root, 'design/rost.pen'))

// A plain static server with the app's own fallback: an unknown path is the SPA's index.html.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4' }
const server = createServer((req, res) => {
  let file = join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(site) || !existsSync(file) || statSync(file).isDirectory()) file = join(site, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

// Where a photo is, from the .pen file: the app's public/ copy when there is one, else copied next to it.
const images = join(dirname(out), 'images')
const image = (url) => {
  let path
  try { path = decodeURIComponent(new URL(url).pathname) } catch { return null }
  const pub = join(app, 'public', path)
  if (existsSync(pub) && statSync(pub).isFile()) return relative(dirname(out), pub)
  const built = join(site, path)
  if (!existsSync(built) || !statSync(built).isFile()) return null
  mkdirSync(images, { recursive: true })
  copyFileSync(built, join(images, basename(path)))
  return relative(dirname(out), join(images, basename(path)))
}

const browser = await chromium.launch()
const pictures = new Map()
let seq = 0
const nid = () => `p${(seq++).toString(36)}`
const frames = []
let x = 0
for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await page.goto(origin + route, { waitUntil: 'networkidle' })
  // Stop what moves, then walk the page once so lazy images load.
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } window.scrollTo(0, 0) })
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  // The whole page in one viewport, so nothing fixed or sticky sits in the middle of it.
  await page.setViewportSize({ width: WIDTH, height: await page.evaluate(() => document.documentElement.scrollHeight) })
  await page.waitForTimeout(300)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  // PEN_SHOTS=<dir> also keeps Chromium's picture of each page, to check the drawing against.
  if (process.env.PEN_SHOTS) { mkdirSync(process.env.PEN_SHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.PEN_SHOTS, `${route.replace(/\W+/g, '_') || 'home'}.png`) }) }
  const els = await capture(page, cdp, 'body')
  const top = els.find((e) => e.parent === null)
  if (!top) { console.log(`${route}: nothing rendered`); continue }
  // pen.dev's image fills don't draw SVG, so an SVG picture (a project's preview, a client's
  // logo) is drawn once by Chromium, at its size on the page, and filled in as a PNG.
  for (const e of els) {
    const svg = (e.picture && e.src) || (!e.svg && e.s['background-image'].match(/url\("?([^")]+\.svg)"?\)/)?.[1])
    if (!svg || pictures.has(svg) || !e.box.w || !e.box.h) continue
    const p = await browser.newPage({ viewport: { width: Math.ceil(e.box.w), height: Math.ceil(e.box.h) }, deviceScaleFactor: 2 })
    await p.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh;object-fit:${e.src ? e.s['object-fit'] || 'fill' : 'cover'}}</style><img src="${svg}">`)
    await p.waitForLoadState('networkidle')
    mkdirSync(images, { recursive: true })
    const file = join(images, basename(new URL(svg).pathname).replace(/\.svg$/, '.png'))
    await p.screenshot({ path: file, omitBackground: true })
    await p.close()
    pictures.set(svg, relative(dirname(out), file))
  }
  const node = toPen(top, els, { kinds, prefix: 'rost:', nid, image: (url) => pictures.get(url) ?? image(url) })
  const title = await page.title()
  frames.push({ ...node, name: route === '/' ? 'Home' : route, x, y: 0, width: WIDTH, clip: true, theme: { mode: 'dark' }, context: `${title} (${route})` })
  x += WIDTH + 200
  console.log(`${route}: ${els.length} elements`)
  await page.close()
}
await browser.close()
server.close()

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ version: '2.21', imports: { rost: library }, children: frames }, null, 1) + '\n')
console.log(`\n${frames.length} page(s) -> ${relative(app, out)}, importing ${library}`)

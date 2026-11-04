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
 * at the app's own file: in `public/`, or the file in the repo the build copied
 * it from, so the design file doesn't hold a second copy of any image.
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync, copyFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { join, extname, dirname, relative, resolve, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { penTokens, capture, toPen } from './lib/pen.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const [appArg, siteArg, outArg, ...routes] = process.argv.slice(2)
if (!appArg || !siteArg || !outArg || !routes.length) {
  console.log('Usage: node bin/build-pen-pages.mjs <app-dir> <built-site-dir | http://dev-server> <out.pen> <route ... | --all | steps.mjs>')
  process.exit(1)
}
// The site is a built folder, served here, or the URL of one already running (an app's dev
// server, for screens that need its own code to set them up). Then the app folder stands in
// for the build when looking for an image's file.
const live = /^https?:\/\//.test(siteArg)
const app = resolve(appArg), site = live ? app : resolve(app, siteArg), out = resolve(app, outArg)
// `--all`: every page of a static site, from the index.html files in its build.
if (routes.length === 1 && routes[0] === '--all') {
  routes.length = 0
  const pages = (dir, base = '/') => readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? pages(join(dir, d.name), `${base}${d.name}/`) : d.name === 'index.html' ? [base] : [])
  routes.push(...pages(site).sort())
}
const WIDTH = 1440
const { kinds } = penTokens(JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')).tokens)
// The library, as the app's file reaches it.
const library = relative(dirname(out), join(root, 'design/rost.pen'))

// A plain static server with the app's own fallback: an unknown path is the SPA's index.html.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4' }
const server = live ? null : createServer((req, res) => {
  let file = join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  // A folder is its own index.html (a static site's /docs/); anything unknown is the app's index.html (an SPA's route).
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(site) || !existsSync(file)) file = join(site, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
})
if (server) await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = live ? siteArg.replace(/\/$/, '') : `http://127.0.0.1:${server.address().port}`

// Where a photo is, from the .pen file: the app's public/ copy when there is one, else copied next to it.
const images = join(dirname(out), 'images')
// Every file in the app's repo, by size, to find where a built file came from.
const repo = (() => { try { return execSync('git rev-parse --show-toplevel', { cwd: app }).toString().trim() } catch { return app } })()
const SKIP = new Set(['node_modules', '.git', 'dist', 'test-results', '.pen-build'])
const bySize = new Map()
const index = (dir) => {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name)
    if (d.isDirectory()) { if (!SKIP.has(d.name) && p !== site && p !== images) index(p) } else if (d.isFile()) {
      const n = statSync(p).size
      if (!bySize.has(n)) bySize.set(n, [])
      bySize.get(n).push(p)
    }
  }
}
index(repo)
const sha = (f) => createHash('sha1').update(readFileSync(f)).digest('hex')
const source = (built) => { const h = sha(built); return (bySize.get(statSync(built).size) ?? []).find((p) => sha(p) === h) ?? null }

const image = (url) => {
  // An image the build inlined (data:image/png;base64,...) is written out once, named by its bytes.
  const inlined = url.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.*)$/s)
  if (inlined) {
    const bytes = Buffer.from(inlined[2], 'base64')
    mkdirSync(images, { recursive: true })
    const file = join(images, `inline-${createHash('sha1').update(bytes).digest('hex').slice(0, 12)}.${inlined[1].replace('jpeg', 'jpg')}`)
    if (!existsSync(file)) writeFileSync(file, bytes)
    return relative(dirname(out), file)
  }
  let path
  try { path = decodeURIComponent(new URL(url).pathname) } catch { return null }
  const pub = join(app, 'public', path)
  if (existsSync(pub) && statSync(pub).isFile()) return relative(dirname(out), pub)
  const built = join(site, path)
  if (!existsSync(built) || !statSync(built).isFile()) return null
  // A file the build renamed (assets/arch-glow-B3xK.png) points at the same bytes in the repo.
  const same = source(built)
  if (same) return relative(dirname(out), same)
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
// Routes, or a module of steps for an app whose screens are states, not addresses:
//   export default [{ name: 'Locked', fresh: true, run: async (page, origin) => { ... } }, ...]
// Each step leaves the page on a screen; `fresh` starts it in a new browser profile (no storage).
const steps = routes.length === 1 && routes[0].endsWith('.mjs')
  ? (await import(pathToFileURL(resolve(app, routes[0])).href)).default
  : routes.map((r) => ({ name: r === '/' ? 'Home' : r, route: r }))
const contextOptions = { viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' }
let context = await browser.newContext(contextOptions)
for (const step of steps) {
  if (step.fresh) { await context.close(); context = await browser.newContext(contextOptions) }
  const route = step.route ?? step.name
  const page = await context.newPage()
  if (step.route) await page.goto(origin + step.route, { waitUntil: 'networkidle' })
  if (step.run) await step.run(page, origin)
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
  // The page is the body itself: a site's header, sidebar and main column sit side by side in it.
  const els = await capture(page, cdp, 'html')
  const top = els.find((e) => e.tag === 'body')
  // pen.dev has no scale, so an element the page scales (a component's preview in its card) is
  // photographed by Chromium, the outermost one only, and drawn as that picture.
  const scaled = (e) => { const m = e.s.transform.match(/^matrix\(([^)]+)\)/)?.[1].split(',').map(Number); return m && Math.abs(m[1]) < 1e-6 && Math.abs(m[0] - 1) > 0.01 }
  const isIn = (e, a) => { for (let x = e; x; x = els.find((c) => String(c.k) === x.parent)) if (x === a) return true; return false }
  const outer = els.filter(scaled).filter((e, _, all) => !all.some((a) => a !== e && isIn(e, a)))
  for (const e of outer) {
    if (!e.box.w || !e.box.h) continue
    mkdirSync(images, { recursive: true })
    const file = join(images, `preview-${route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'}-${e.k}.png`)
    await page.locator(`[data-pk="${e.k}"]`).screenshot({ path: file, omitBackground: true }).catch(() => {})
    if (existsSync(file)) e.snapshot = relative(dirname(out), file)
  }
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
    const file = join(images, svg.startsWith('data:') ? `inline-${createHash('sha1').update(svg).digest('hex').slice(0, 12)}.png` : basename(new URL(svg).pathname).replace(/\.svg$/, '.png'))
    await p.screenshot({ path: file, omitBackground: true })
    await p.close()
    pictures.set(svg, relative(dirname(out), file))
  }
  const node = toPen(top, els, { kinds, prefix: 'rost:', nid, image: (url) => pictures.get(url) ?? image(url) })
  const title = await page.title()
  frames.push({ ...node, name: step.name, x, y: 0, width: WIDTH, clip: true, theme: { mode: 'dark' }, context: `${title} (${step.route ?? step.name})` })
  x += WIDTH + 200
  console.log(`${route}: ${els.length} elements`)
  await page.close()
}
await browser.close()
server?.close()

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ version: '2.21', imports: { rost: library }, children: frames }, null, 1) + '\n')
console.log(`\n${frames.length} page(s) -> ${relative(app, out)}, importing ${library}`)

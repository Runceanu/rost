#!/usr/bin/env node
/**
 * Measures the contrast of every piece of text and every icon in every
 * fixture, in both themes, against WCAG AA: 4.5 for text (3 for large text),
 * 3 for icons.
 *
 * It measures what's drawn, not token pairs, because a lot of Rost's
 * backgrounds are a token at an opacity, on a separate layer. For each piece of
 * text it reads the computed colour and the opacity of everything around it,
 * hides the text, takes a screenshot of the box, and calls the most common
 * colour there the background. Icons drawn with a CSS mask are measured the
 * same way. Icons that are pictures (<img>) have their colour baked in, so
 * they're listed apart. Hover, pressed and focus are forced the way
 * visual-test does it. Disabled variants are listed but don't count: WCAG
 * leaves them out.
 *
 *   node bin/contrast.mjs                 every component
 *   node bin/contrast.mjs button chips    some
 *   node bin/contrast.mjs --all           every measurement, not just the failures
 *   node bin/contrast.mjs --strict        exit 1 if something fails in light that passes in dark
 */
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
const all = args.includes('--all')
const strict = args.includes('--strict')
const ids = args.filter((a) => !a.startsWith('--'))
const components = ids.length ? ids : readdirSync(join(root, 'src/components')).filter((d) => existsSync(join(root, 'src/components', d, `${d}.fixtures.tsx`)))
const THEMES = ['dark', 'light']
const SETTLE_MS = 60

const svgUrl = { name: 'svg-url', setup(b) { b.onResolve({ filter: /\.svg\?url$/ }, (a) => ({ path: join(a.resolveDir, a.path.replace(/\?url$/, '')) })) } }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = path.startsWith('/repo/') ? join(root, path.slice(6)) : null
  if (!file || !file.startsWith(root) || !existsSync(file)) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const over = (fg, alpha, bg) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha))
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/** The most common colour in a screenshot, in steps of 4 so anti-aliasing doesn't split it. */
function dominant(png) {
  const count = new Map()
  for (let i = 0; i < png.data.length; i += 4) {
    const k = ((png.data[i] >> 2) << 16) | ((png.data[i + 1] >> 2) << 8) | (png.data[i + 2] >> 2)
    count.set(k, (count.get(k) ?? 0) + 1)
  }
  const [k] = [...count].sort((a, b) => b[1] - a[1])[0]
  return [(k >> 16) << 2, ((k >> 8) & 63) << 2, (k & 63) << 2].map((v) => v + 2)
}

const browser = await chromium.launch()
const rows = []
const pictures = new Set()
const work = join(root, 'test-results/contrast')
rmSync(work, { recursive: true, force: true })

for (const id of components) {
  const dir = join(work, id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'entry.tsx'), `
    import { createRoot } from 'react-dom/client'
    import { fixtures } from '${join(root, 'src/components', id, `${id}.fixtures.tsx`)}'
    createRoot(document.getElementById('root')).render(
      <>{fixtures.map((f, i) => <div key={i} data-fixture={i} data-name={f.name ?? f.node} data-force={(f.force ?? []).join(' ')} data-force-on={f.forceOn ?? ''} style={{ margin: 8, display: 'flow-root' }}>{f.element}</div>)}</>
    )`)
  await build({ entryPoints: [join(dir, 'entry.tsx')], bundle: true, outdir: dir, jsx: 'automatic', logLevel: 'error', loader: { '.svg': 'file', '.png': 'file', '.jpg': 'file', '.webp': 'file' }, plugins: [svgUrl] })

  for (const theme of THEMES) {
    writeFileSync(join(dir, `${theme}.html`), `<!doctype html><html data-theme="${theme}"><meta charset="utf-8">
      <link rel="stylesheet" href="${origin}/repo/tokens/tokens.css">
      <style>body { margin: 0; background: var(--non-interactive-background-primary); } * { transition: none !important; animation: none !important; }</style>
      <link rel="stylesheet" href="entry.css"><div id="root"></div><script src="entry.js"></script>`)
    const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1400, height: 900 } })
    await page.goto(`${origin}/repo/test-results/contrast/${id}/${theme}.html`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(SETTLE_MS)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')

    const count = await page.$$eval('[data-fixture]', (els) => els.length)
    for (let f = 0; f < count; f++) {
      const meta = await page.$eval(`[data-fixture="${f}"]`, (e) => ({ name: e.dataset.name, force: e.dataset.force.split(' ').filter(Boolean), on: e.dataset.forceOn }))
      let forced = 0
      if (meta.force.length) {
        const { root: doc } = await cdp.send('DOM.getDocument', { depth: -1 })
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector: `[data-fixture="${f}"] ${meta.on || `.rost-${id}`}` })
        if (nodeId) { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: meta.force }); forced = nodeId }
        await page.waitForTimeout(SETTLE_MS)
      }
      // Everything that draws a colour on top of something: text, and mask icons.
      const marks = await page.$eval(`[data-fixture="${f}"]`, (box) => {
        const out = []
        const parse = (c) => { const m = c.match(/[\d.]+/g)?.map(Number) ?? []; return { rgb: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 } }
        const fade = (el) => { let o = 1; for (let p = el; p && p !== box.parentElement; p = p.parentElement) o *= Number(getComputedStyle(p).opacity); return o }
        let n = 0
        for (const el of box.querySelectorAll('*')) {
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || cs.display === 'none') continue
          const r = el.getBoundingClientRect()
          if (r.width < 2 || r.height < 2) continue
          const disabled = !!el.closest('[disabled], [aria-disabled="true"]') || /disabled/i.test(box.dataset.name)
          const text = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())
          const mask = cs.maskImage && cs.maskImage !== 'none' || cs.webkitMaskImage && cs.webkitMaskImage !== 'none'
          if (el.tagName === 'IMG' && el.src.endsWith('.svg')) out.push({ picture: el.src.split('/').pop().replace(/-[A-Z0-9]{8}(?=\.svg$)/, '') })
          if (!text && !mask) continue
          const c = parse(text ? cs.color : cs.backgroundColor)
          if (!mask && c.a === 0) continue
          const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight)
          const large = size >= 24 || (size >= 18.66 && weight >= 700)
          el.dataset.contrast = String(n)
          out.push({ n: n++, kind: text ? 'text' : 'icon', what: text ? el.textContent.trim().slice(0, 24) : el.className.split(' ')[0], cls: [...el.classList].find((k) => k.includes('__')) ?? el.className.split(' ')[0] ?? el.tagName.toLowerCase(), rgb: c.rgb, alpha: c.a * fade(el), need: text ? (large ? 3 : 4.5) : 3, disabled })
        }
        return out
      })
      for (const m of marks) {
        if (m.picture) { pictures.add(`${id}: ${m.picture}`); continue }
        const sel = `[data-contrast="${m.n}"]`
        const clip = await page.$eval(sel, (el, kind) => {
          el.scrollIntoView({ block: 'center' })
          el.dataset.was = el.getAttribute('style') ?? ''
          el.style.setProperty(kind === 'text' ? 'color' : 'visibility', kind === 'text' ? 'transparent' : 'hidden', 'important')
          const r = el.getBoundingClientRect()
          return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.max(1, Math.min(r.width, innerWidth - r.x)), height: Math.max(1, Math.min(r.height, innerHeight - r.y)) }
        }, m.kind)
        const shot = PNG.sync.read(await page.screenshot({ clip }))
        await page.$eval(sel, (el) => { el.setAttribute('style', el.dataset.was); delete el.dataset.was })
        const bg = dominant(shot)
        const fg = over(m.rgb, m.alpha, bg)
        rows.push({ id, theme, fixture: meta.name, kind: m.kind, part: m.cls, what: m.what, fg: hex(fg), bg: hex(bg), ratio: ratio(fg, bg), need: m.need, disabled: m.disabled })
      }
      await page.$$eval(`[data-fixture="${f}"] [data-contrast]`, (els) => els.forEach((e) => delete e.dataset.contrast))
      if (forced) await cdp.send('CSS.forcePseudoState', { nodeId: forced, forcedPseudoClasses: [] })
    }
    await page.close()
  }
  process.stdout.write('.')
}
await browser.close()
server.close()
console.log()

// Line the two themes up: the same mark in the same fixture.
const key = (r) => `${r.id}|${r.fixture}|${r.part}|${r.what}`
const dark = new Map(rows.filter((r) => r.theme === 'dark').map((r) => [key(r), r]))
const light = rows.filter((r) => r.theme === 'light')
const fails = (r) => r && r.ratio < r.need
const show = light.filter((r) => all || fails(r) || fails(dark.get(key(r))))
let last = ''
for (const r of show) {
  const d = dark.get(key(r))
  if (r.id !== last) { console.log(`\n${r.id}`); last = r.id }
  const cell = (x) => (x ? `${x.ratio.toFixed(2).padStart(5)}${fails(x) ? '✗' : ' '} ${x.fg} on ${x.bg}` : '   n/a')
  console.log(`  ${r.fixture.padEnd(34)} ${`${r.part} "${r.what}"`.slice(0, 40).padEnd(40)} need ${r.need}  dark ${cell(d)}   light ${cell(r)}${r.disabled ? '  (disabled)' : ''}`)
}
const live = light.filter((r) => !r.disabled)
const lightFails = live.filter(fails)
const onlyLight = lightFails.filter((r) => !fails(dark.get(key(r))))
const darkFails = rows.filter((r) => r.theme === 'dark' && !r.disabled && fails(r))
console.log(`\n${live.length} marks measured per theme, not counting disabled. ${darkFails.length} fail in dark, ${lightFails.length} in light, ${onlyLight.length} of those only in light.`)
if (pictures.size) console.log(`Pictures with their colour baked in (not measured, and the same in both themes):\n  ${[...pictures].sort().join('\n  ')}`)
writeFileSync(join(work, 'results.json'), JSON.stringify(rows, null, 2) + '\n')
if (strict && onlyLight.length) process.exit(1)

#!/usr/bin/env node
/**
 * Checks every fixture of every component against WCAG 2.1 AA, in both themes,
 * for what bin/contrast.mjs doesn't cover:
 *
 *   axe     axe-core's WCAG 2.0 and 2.1 A and AA rules: names, roles, states,
 *           ARIA, labels. Its colour-contrast rule is left out, because
 *           contrast.mjs measures what's drawn and axe can't see through masks
 *           and opacity layers.
 *   focus   2.4.7 and 1.4.11. Each control is focused from the keyboard. Some
 *           pixels have to change, and the colour they change to has to reach
 *           3:1 against the colour they were.
 *   edges   1.4.11. A field, a switch or a toggle has to be told apart from
 *           the page by its edge or its fill, at 3:1. A button is named by its
 *           label, so it isn't measured.
 *
 * Disabled fixtures and the forced hover, pressed and focus ones are skipped:
 * WCAG leaves disabled out, and the focus check makes its own focus.
 *
 *   node bin/a11y.mjs                every component
 *   node bin/a11y.mjs button input   some
 */
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'

const root = fileURLToPath(new URL('../', import.meta.url))
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const components = ids.length ? ids : readdirSync(join(root, 'src/components')).filter((d) => existsSync(join(root, 'src/components', d, `${d}.fixtures.tsx`)))
const THEMES = ['dark', 'light']
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
// Rules about a whole document. Each fixture page is a test bench, not a page.
const PAGE_RULES = ['html-has-lang', 'document-title', 'landmark-one-main', 'region', 'page-has-heading-one', 'bypass', 'color-contrast']

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
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const px = (png, i) => [png.data[i], png.data[i + 1], png.data[i + 2]]

/**
 * What focus drew. Every pixel that changed, and how far its new colour is
 * from its old one. It passes when enough of them reach 3:1 to go half way
 * round the control at 1px: a ring round a switch's track, not its label, still counts.
 */
function focusChange(before, after, ring) {
  const pairs = new Map()
  let changed = 0, strong = 0
  for (let i = 0; i < before.data.length; i += 4) {
    const a = px(before, i), b = px(after, i)
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 24) continue
    changed++
    if (ratio(a, b) >= 3) { strong++; continue }
    const k = `${hex(b.map((v) => v & ~7))}|${hex(a.map((v) => v & ~7))}`
    pairs.set(k, (pairs.get(k) ?? 0) + 1)
  }
  if (!changed) return { changed: 0 }
  if (strong >= ring) return { changed, ok: true }
  const [k] = [...pairs].sort((p, q) => q[1] - p[1])[0]
  const [to, from] = k.split('|').map((h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16) + 4))
  return { changed, ok: false, ratio: ratio(to, from), to: hex(to), from: hex(from), strong, ring }
}

/** The most common colour in a list of pixels, in steps of 4. */
function dominant(cols) {
  if (!cols.length) return null
  const count = new Map()
  for (const c of cols) { const k = c.map((v) => v >> 2).join(','); count.set(k, (count.get(k) ?? 0) + 1) }
  const [k] = [...count].sort((a, b) => b[1] - a[1])[0]
  return k.split(',').map((v) => (Number(v) << 2) + 2)
}
/** The pixels just inside a box's outline, from a full-page screenshot. */
function outline(png, r) {
  const out = []
  const at = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= png.width || y >= png.height) return; out.push(px(png, (y * png.width + x) * 4)) }
  const inset = 0, x0 = r.x + inset, y0 = r.y + inset, x1 = r.x + r.width - 1 - inset, y1 = r.y + r.height - 1 - inset
  // Skip the corners, where the radius shows the page through.
  const rad = Math.min(r.radius, r.width / 2, r.height / 2)
  for (let x = x0 + rad; x <= x1 - rad; x++) { at(x, y0); at(x, y1) }
  for (let y = y0 + rad; y <= y1 - rad; y++) { at(x0, y); at(x1, y) }
  return out
}

const browser = await chromium.launch()
const found = []
const add = (r) => found.push(r)
const work = join(root, 'test-results/a11y')
rmSync(work, { recursive: true, force: true })

for (const id of components) {
  const dir = join(work, id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'entry.tsx'), `
    import { createRoot } from 'react-dom/client'
    import { fixtures } from '${join(root, 'src/components', id, `${id}.fixtures.tsx`)}'
    createRoot(document.getElementById('root')).render(
      <>{fixtures.map((f, i) => <div key={i} data-fixture={i} data-name={f.name ?? f.node} data-force={(f.force ?? []).join(' ')} style={{ margin: 16, display: 'flow-root' }}>{f.element}</div>)}</>
    )`)
  await build({ entryPoints: [join(dir, 'entry.tsx')], bundle: true, outdir: dir, jsx: 'automatic', logLevel: 'error', loader: { '.svg': 'file', '.png': 'file', '.jpg': 'file', '.webp': 'file' }, plugins: [svgUrl] })

  for (const theme of THEMES) {
    writeFileSync(join(dir, `${theme}.html`), `<!doctype html><html lang="en" data-theme="${theme}"><meta charset="utf-8"><title>${id}</title>
      <link rel="stylesheet" href="${origin}/repo/tokens/tokens.css">
      <style>body { margin: 0; background: var(--non-interactive-background-primary); color: var(--non-interactive-foreground-primary); } * { transition: none !important; animation: none !important; caret-color: transparent !important; } ::selection { background: transparent; }</style>
      <link rel="stylesheet" href="entry.css"><main id="root"></main><script src="entry.js"></script>`)
    const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1400, height: 900 } })
    await page.goto(`${origin}/repo/test-results/a11y/${id}/${theme}.html`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(60)

    // axe, once per theme: its rules don't depend on colour, but run both so a
    // theme-only problem would show.
    await page.addScriptTag({ content: AXE })
    const axe = await page.evaluate(async (off) => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, rules: Object.fromEntries(off.map((k) => [k, { enabled: false }])) })
      return r.violations.map((v) => ({ rule: v.id, impact: v.impact, help: v.help, sc: v.tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => t.slice(4).split('').join('.')), nodes: v.nodes.map((n) => ({ fixture: document.querySelector(n.target[0])?.closest('[data-fixture]')?.dataset.name ?? '', html: n.html.slice(0, 120), why: n.failureSummary?.split('\n').slice(1).join(' ').trim() })) }))
    }, PAGE_RULES)
    for (const v of axe) for (const n of v.nodes) add({ id, theme, check: 'axe', fixture: n.fixture, what: `${v.rule}: ${v.help}`, sc: v.sc.join(', '), detail: n.why || n.html })

    const count = await page.$$eval('[data-fixture]', (els) => els.length)
    for (let f = 0; f < count; f++) {
      const meta = await page.$eval(`[data-fixture="${f}"]`, (e) => ({ name: e.dataset.name, forced: !!e.dataset.force }))
      if (meta.forced || /disabled/i.test(meta.name)) continue
      const controls = await page.$$eval(`[data-fixture="${f}"] :is(a[href], button, input, textarea, select, [tabindex]):not([tabindex="-1"]):not([disabled]):not([aria-disabled="true"])`, (els) => els.map((el, i) => {
        el.dataset.ctl = String(i)
        const cs = getComputedStyle(el)
        return { i, tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), pressed: el.getAttribute('aria-pressed'), checked: el.getAttribute('aria-checked'), cls: [...el.classList][0] ?? el.tagName.toLowerCase(), border: parseFloat(cs.borderTopWidth) || 0 }
      }))
      for (const c of controls) {
        const sel = `[data-fixture="${f}"] [data-ctl="${c.i}"]`
        // The whole fixture and a margin round it: a ring can sit outside the control.
        const { clip, ring } = await page.$eval(sel, (el) => {
          el.scrollIntoView({ block: 'center' })
          const box = el.closest('[data-fixture]').getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 12
          return { clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(box.width + pad * 2, innerWidth - box.x + pad), height: Math.min(box.height + pad * 2, innerHeight - box.y + pad) }, ring: Math.round(r.width + r.height) }
        })
        // Focus from the keyboard, so :focus-visible applies: focus the thing
        // before it, then Tab.
        await page.evaluate(() => { document.activeElement?.blur(); document.body.focus() })
        await page.mouse.move(0, 0)
        const before = PNG.sync.read(await page.screenshot({ clip }))
        await page.$eval(sel, (el) => { const t = document.createElement('button'); t.id = 'a11y-before'; t.style.cssText = 'position:fixed;left:-99px;top:0'; document.body.prepend(t); t.focus() })
        await page.keyboard.press('Tab')
        // Tab lands on the first focusable thing after the probe, which is the
        // first control on the page; walk to this one.
        for (let n = 0; n < 200; n++) {
          if (await page.$eval(sel, (el) => document.activeElement === el || el.contains(document.activeElement))) break
          await page.keyboard.press('Tab')
        }
        const reached = await page.$eval(sel, (el) => document.activeElement === el || el.contains(document.activeElement))
        await page.evaluate(() => window.getSelection()?.removeAllRanges())
        const after = PNG.sync.read(await page.screenshot({ clip }))
        await page.evaluate(() => document.getElementById('a11y-before')?.remove())
        const name = `${c.cls}${c.role ? ` role=${c.role}` : ''}`
        if (!reached) { add({ id, theme, check: 'keyboard', fixture: meta.name, what: `${name} can't be reached with Tab`, sc: '2.1.1' }); continue }
        // A field whose fixture sets `selected` has its look pinned; its 'follows focus' fixture is the one to check.
        const pinned = /selected=/.test(meta.name) && ['input', 'textarea'].includes(id)
        const ch = pinned ? { changed: 1, ok: true } : focusChange(before, after, ring)
        if (!ch.changed) add({ id, theme, check: 'focus', fixture: meta.name, what: `${name}: nothing changes on focus`, sc: '2.4.7' })
        else if (!ch.ok) add({ id, theme, check: 'focus', fixture: meta.name, what: `${name}: ${ch.strong} of a ${ch.ring}px ring reach 3:1; most of the change is ${ch.to} over ${ch.from}`, sc: '1.4.11', ratio: ch.ratio })

        // Edges: fields, switches and toggles, against the page. The box that
        // draws it is the biggest one in the component with an edge or a fill.
        const field = ['input', 'textarea', 'select'].includes(c.tag) || c.role === 'switch' || c.pressed !== null
        if (field) {
          await page.evaluate(() => document.activeElement?.blur())
          await page.mouse.move(0, 0)
          const boxes = await page.$eval(sel, (el) => {
            const top = el.closest(`[class^="rost-"]:not([class*="__"])`) ?? el
            const all = [top, ...top.querySelectorAll('*')].filter((p) => {
              const cs = getComputedStyle(p)
              if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'absolute' && /focus/.test(p.className)) return false
              return (parseFloat(cs.borderTopWidth) && cs.borderTopStyle !== 'none') || cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
            })
            const rect = (p) => { const r = p.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height, radius: parseFloat(getComputedStyle(p).borderTopLeftRadius) || 0, cls: [...p.classList].find((k) => k.includes('__')) ?? p.className } }
            const sorted = all.map(rect).sort((a, b) => b.width * b.height - a.width * a.height)
            const thumb = top.querySelector('[class*="__thumb"]'), track = top.querySelector('[class*="__background"]')
            return { box: sorted[0] ?? null, thumb: thumb && rect(thumb), track: track && rect(track) }
          })
          const shot = PNG.sync.read(await page.screenshot({ fullPage: true }))
          const pageBg = dominant(outline(shot, { x: 2, y: 2, width: 40, height: 40, radius: 0 }))
          const drawn = boxes.box && dominant(outline(shot, boxes.box))
          const edge = drawn ? ratio(drawn, pageBg) : 0
          if (boxes.box && !drawn) { /* too small to sample */ } else if (edge < 3) add({ id, theme, check: 'edges', fixture: meta.name, what: `${name}: its edge (${boxes.box?.cls ?? 'none'}) reaches ${edge.toFixed(2)}:1 against the page`, sc: '1.4.11', ratio: edge })
          if (boxes.thumb && boxes.track) {
            const centre = (r) => px(shot, (Math.round(r.y + r.height / 2) * shot.width + Math.round(r.x + r.width / 2)) * 4)
            const t = centre(boxes.thumb)
            const k = dominant(outline(shot, { ...boxes.track, radius: boxes.track.radius / 2 }))
            const tr = k ? ratio(t, k) : 99
            if (tr < 3) add({ id, theme, check: 'edges', fixture: meta.name, what: `${name}: the thumb (${hex(t)}) reaches ${tr.toFixed(2)}:1 against its track (${hex(k)})`, sc: '1.4.11', ratio: tr })
          }
        }
      }
    }
    await page.close()
  }
  process.stdout.write('.')
}
await browser.close()
server.close()
console.log()

// One line per finding, with the themes it shows in.
const key = (r) => `${r.id}|${r.check}|${r.fixture}|${r.what.replace(/#[0-9a-f]{6}/g, '')}`
const merged = new Map()
for (const r of found) { const k = key(r); const m = merged.get(k) ?? { ...r, themes: [] }; m.themes.push(r.theme); merged.set(k, m) }
let last = ''
for (const r of [...merged.values()].sort((a, b) => a.id.localeCompare(b.id) || a.check.localeCompare(b.check))) {
  if (r.id !== last) { console.log(`\n${r.id}`); last = r.id }
  console.log(`  ${r.check.padEnd(8)} ${r.sc.padEnd(10)} ${r.themes.join('+').padEnd(10)} ${r.fixture.slice(0, 34).padEnd(34)} ${r.what}${r.ratio ? ` (${r.ratio.toFixed(2)}:1)` : ''}${r.detail ? `\n${' '.repeat(66)}${r.detail.slice(0, 160)}` : ''}`)
}
const by = (t) => [...merged.values()].filter((r) => r.themes.includes(t)).length
console.log(`\n${components.length} components. ${merged.size} findings: ${by('dark')} in dark, ${by('light')} in light.`)
writeFileSync(join(work, 'results.json'), JSON.stringify([...merged.values()], null, 2) + '\n')

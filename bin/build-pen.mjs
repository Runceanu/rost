#!/usr/bin/env node
/**
 * Writes design/rost.pen, Rost as a pen.dev library: every token as a
 * variable (dark and light) and every component variant as a reusable
 * component. A product's own .pen file imports it:
 *
 *   "imports": { "rost": "../rost/design/rost.pen" }
 *
 * and then uses `$rost:<token>` and `rost:<component id>`.
 *
 *   node bin/build-pen.mjs                 everything
 *   node bin/build-pen.mjs badge button    only these (the tokens always)
 *
 * The components aren't drawn by hand. Each fixture is rendered in Chromium,
 * the way the visual test renders it (forced states and all), and its DOM
 * becomes pen.dev frames, text and paths. Every value that the CSS takes from
 * a token stays bound to that token: Chrome's own matched styles say which
 * `var(--...)` won for each property, so two tokens that both come out as
 * #3a3a3a stay two tokens.
 *
 * Two of pen.dev's own rules: a variable on width or height is dropped, so
 * sizes are numbers (the token is in the node's context), and an opacity
 * variable is a percentage, so `opacity-gentle` is 24 here, not 0.24.
 *
 * What doesn't carry over: pen.dev only draws Google fonts, so General Sans
 * shows as a fallback there (the variable still says General Sans). Motion,
 * and a component inside another (Thumbs' Badge) is drawn in place, not as
 * an instance.
 */
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { penTokens, capture, toPen, classKey, stableIds } from './lib/pen.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const font = process.env.ROST_FONT ?? join(homedir(), 'Library/Fonts/GeneralSans-Variable.ttf')
const out = join(root, 'design/rost.pen')
const work = join(root, 'test-results/pen')

// ── Tokens ──────────────────────────────────────────────────────────────
// Named as in code (the CSS variable without `--`), so `$rost:actions-primary-
// default-background` in a design is `var(--actions-primary-default-background)`.
const { variables, kinds } = penTokens(JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')).tokens)
const { tokens } = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'))

// ── Components ──────────────────────────────────────────────────────────
const all = readdirSync(join(root, 'src/components')).filter((d) => existsSync(join(root, 'src/components', d, `${d}.fixtures.tsx`)))
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all
const metrics = ' ' + (readFileSync(join(root, 'tokens/fonts.css'), 'utf8').match(/(?:ascent|descent|line-gap)-override:[^;]+;/g) ?? []).join(' ')

const svgUrl = { name: 'svg-url', setup(b) { b.onResolve({ filter: /\.svg\?url$/ }, (a) => ({ path: join(a.resolveDir, a.path.replace(/\?url$/, '')) })) } }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' }
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = path === '/font' ? font : path.startsWith('/repo/') ? join(root, path.slice(6)) : null
  if (!file || (!file.startsWith(root) && file !== font) || !existsSync(file)) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()

// Ids are made here, short and stable per run: component, fixture, node.
let seq = 0
const nid = () => `n${(seq++).toString(36)}`
const boards = []
const shots = {}
mkdirSync(join(work, 'shots'), { recursive: true })

for (const id of ids) {
  const dir = join(work, id)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'entry.tsx'), `
    import { createRoot } from 'react-dom/client'
    import { fixtures } from '${join(root, 'src/components', id, `${id}.fixtures.tsx`)}'
    createRoot(document.getElementById('root')).render(
      <>{fixtures.map((f, i) => <div key={i} data-fix={i} data-name={f.name ?? ''} data-force={(f.force ?? []).join(' ')} data-force-on={f.forceOn ?? ''} style={{ margin: 8, display: 'flow-root' }}>{f.element}</div>)}</>
    )`)
  await build({ entryPoints: [join(dir, 'entry.tsx')], bundle: true, outdir: dir, jsx: 'automatic', logLevel: 'error', loader: { '.svg': 'file', '.png': 'file', '.jpg': 'file', '.webp': 'file' }, plugins: [svgUrl] })
  const face = `@font-face { font-family: 'General Sans Variable'; font-weight: 200 700; src: url('${origin}/font') format('truetype');${metrics} }`
  writeFileSync(join(dir, 'index.html'), `<!doctype html><html data-theme="dark"><meta charset="utf-8">
    <link rel="stylesheet" href="${origin}/repo/tokens/tokens.css">
    <style>${face} body { margin: 0; background: var(--non-interactive-background-primary); -webkit-font-smoothing: antialiased; }</style>
    <link rel="stylesheet" href="entry.css"><div id="root"></div><script src="entry.js"></script>`)

  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1600, height: 1000 } })
  await page.goto(`${origin}/repo/${join('test-results/pen', id, 'index.html')}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(100)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')


  const count = await page.$$eval('[data-fix]', (els) => els.length)
  const components = []
  for (let i = 0; i < count; i++) {
    const meta = await page.$eval(`[data-fix="${i}"]`, (e) => ({ name: e.dataset.name, force: e.dataset.force.split(' ').filter(Boolean), on: e.dataset.forceOn }))
    const { root: doc } = await cdp.send('DOM.getDocument', { depth: -1 })
    let forced = 0
    if (meta.force.length) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector: `[data-fix="${i}"] ${meta.on || `.rost-${id}`}` })
      if (nodeId) { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: meta.force }); forced = nodeId }
      await page.waitForTimeout(60)
    }
    const els = await capture(page, cdp, `[data-fix="${i}"]`, doc)
    const by = new Map(els.map((e) => [String(e.k), e]))
    // Chromium's own picture of it, for checking the pen.dev drawing against (bin/check-pen.mjs).
    const shot = `${id}-${i}.png`
    await (await page.$(`[data-fix="${i}"] > *`))?.screenshot({ path: join(work, 'shots', shot), omitBackground: false }).catch(() => {})
    if (forced) await cdp.send('CSS.forcePseudoState', { nodeId: forced, forcedPseudoClasses: [] })
    // The component's own root: past any plain wrapper the fixture puts around it.
    let top = els.find((e) => e.parent === null || !by.has(e.parent))
    while (top && !/(^|\s)rost-/.test(String(top.cls)) && els.filter((c) => c.parent === String(top.k)).length === 1) top = els.find((c) => c.parent === String(top.k))
    if (!top) continue
    // Ids from the variant's name, so a rebuilt library keeps them and the apps' instances still
    // point somewhere. The root's classes say which variant a page's component is.
    const title = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
    const pen = stableIds(toPen(top, els, { kinds, nid }), `${title}/${meta.name || 'Default'}`)
    pen.metadata = { type: 'rost-variant', component: id, classes: classKey(top.cls), forced: meta.force.join(' ') }
    shots[pen.id] = shot
    components.push({ name: meta.name, node: pen, h: top.box.h })
  }
  await page.close()
  const title = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  boards.push({ id, title, components })
  console.log(`${id}: ${components.length} variant(s)`)
}
await browser.close()
server.close()


// ── The file ────────────────────────────────────────────────────────────
// One board per component, the variants in rows of four, each one reusable.
const GAP = 48
let y = 0
const children = []
for (const b of boards) {
  const rows = []
  for (let i = 0; i < b.components.length; i += 4) rows.push(b.components.slice(i, i + 4))
  const board = {
    type: 'frame', id: nid(), name: b.title, x: 0, y, layout: 'vertical', gap: 24, padding: 40, fill: '$non-interactive-background-primary', theme: { mode: 'dark' }, cornerRadius: 24,
    children: [
      { type: 'text', id: nid(), name: 'Title', content: b.title, fontFamily: '$font-family-base', fontSize: 32, fontWeight: '500', fill: '$non-interactive-foreground-primary' },
      ...rows.map((row) => ({ type: 'frame', id: nid(), name: 'Row', layout: 'horizontal', gap: 40, alignItems: 'start', children: row.map((c) => ({
        type: 'frame', id: nid(), name: 'Variant', layout: 'vertical', gap: 12, children: [
          { ...c.node, name: `${b.title}/${c.name || 'Default'}`, reusable: true },
          { type: 'text', id: nid(), name: 'Caption', content: c.name || 'Default', fontFamily: 'JetBrains Mono', fontSize: 11, fill: '$non-interactive-foreground-tertiary' },
        ],
      })) })),
    ],
  }
  children.push(board)
  // The board's height, from what each variant measured in the browser: the tallest per row, its caption and the gaps.
  y += 40 * 2 + 44 + rows.reduce((h, row) => h + 24 + Math.max(...row.map((c) => c.h)) + 12 + 16, 0) + GAP
}

const doc = { version: '2.21', themes: { mode: ['dark', 'light'] }, variables, children }
mkdirSync(join(root, 'design'), { recursive: true })
writeFileSync(out, JSON.stringify(doc, null, 1) + '\n')
writeFileSync(join(work, 'shots.json'), JSON.stringify(shots, null, 1))
console.log(`\n${Object.keys(variables).length} variables, ${boards.reduce((n, b) => n + b.components.length, 0)} components -> design/rost.pen`)

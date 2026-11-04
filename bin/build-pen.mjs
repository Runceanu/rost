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
import { foundations } from './lib/pen-foundations.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const font = process.env.ROST_FONT ?? join(homedir(), 'Library/Fonts/GeneralSans-Variable.ttf')
const out = join(root, 'design/rost.lib.pen')
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
    components.push({ name: meta.name, node: pen, w: top.box.w, h: top.box.h })
  }
  await page.close()
  const title = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  boards.push({ id, title, components })
  console.log(`${id}: ${components.length} variant(s)`)
}
await browser.close()
server.close()


// ── The file ────────────────────────────────────────────────────────────
// Laid out like the Figma file: the token pages first, then one page per Figma
// page (badge, buttons, chip...), each holding its component sets. A set is a
// grid like Figma's variant sets: one property across, the others down, each
// row and column labelled. Components that only exist in code come after.
const FIGMA = { badge: 'badge', button: 'buttons', 'icon-button': 'buttons', carousel: 'carousel', chips: 'chip', divider: 'divider', icon: 'iconography', illustration: 'illustrations', 'inline-banner': 'inline banner', input: 'input', textarea: 'input', menu: 'menu', projects: 'projects', tags: 'tags', testimonials: 'testimonials', 'testimonials-pics': 'testimonials', thumbs: 'thumbs', toggle: 'toggle', 'toggle-group': 'toggle', tooltip: 'tooltip' }
const MONO = 'JetBrains Mono'
const txt = (content, o = {}) => ({ type: 'text', id: nid(), name: o.name ?? 'Label', content, fontFamily: o.font ?? MONO, fontSize: o.size ?? 11, fill: o.fill ?? '$non-interactive-foreground-tertiary', ...(o.weight ? { fontWeight: o.weight } : {}), ...(o.width ? { textGrowth: 'fixed-width', width: o.width } : {}) })

// A variant's properties from its name: "type=Primary, state=Hover" -> [["type","Primary"],["state","Hover"]].
const props = (name) => (/=/.test(name ?? '') && name.split(', ').every((p) => p.includes('=')) ? name.split(', ').map((p) => p.split('=')) : null)

// One component set: the grid, and how big it comes out.
function variantSet(b) {
  const LABEL = 200, PAD = 32, GAPX = 32, GAPY = 32
  const named = b.components.filter((c) => props(c.name))
  const loose = b.components.filter((c) => !props(c.name))
  const keys = named.length ? props(named[0].name).map(([k]) => k) : []
  // Across: `state` when there is one (Figma's sets read that way), or the last property.
  const across = keys.includes('state') ? 'state' : keys.at(-1)
  const down = keys.filter((k) => k !== across)
  const value = (c, k) => Object.fromEntries(props(c.name))[k]
  let cols = [...new Set(named.map((c) => value(c, across)))]
  let rows = [...new Set(named.map((c) => down.map((k) => `${k}=${value(c, k)}`).join(', ')))]
  let at = (r, col) => named.find((c) => value(c, across) === col && down.map((k) => `${k}=${value(c, k)}`).join(', ') === r)
  // One property and many values (24 illustrations, 17 icons) wraps, eight to a row.
  if (!down.length && cols.length > 8) {
    const all = cols
    cols = Array.from({ length: 8 }, (_, i) => String(i))
    rows = Array.from({ length: Math.ceil(all.length / 8) }, (_, i) => String(i))
    const pick = (r, col) => all[Number(r) * 8 + Number(col)]
    at = (r, col) => named.find((c) => value(c, across) === pick(r, col))
  }
  const wrapped = !down.length && cols.length === 8 && rows.length > 1 && cols[0] === '0'
  const colW = cols.map((col) => Math.max(80, ...rows.map((r) => at(r, col)?.w ?? 0)))
  const rowH = rows.map((r) => Math.max(...cols.map((col) => at(r, col)?.h ?? 0)) + (wrapped ? 20 : 0))
  const labelW = down.length ? LABEL : 0
  const cell = (c, w, h, caption) => ({ type: 'frame', id: nid(), name: 'Cell', width: w, height: h, layout: 'vertical', gap: 8, children: c ? [{ ...c.node, name: `${b.title}/${c.name || 'Default'}`, reusable: true }, ...(caption ? [txt(caption)] : [])] : [] })
  const grid = []
  if (named.length) {
    if (!wrapped) grid.push({ type: 'frame', id: nid(), name: 'Columns', layout: 'horizontal', gap: GAPX, children: [
      ...(labelW ? [{ type: 'frame', id: nid(), name: 'Corner', width: labelW, height: 16 }] : []),
      ...cols.map((col, i) => txt(`${across}=${col}`, { width: colW[i] })),
    ] })
    rows.forEach((r, ri) => grid.push({ type: 'frame', id: nid(), name: 'Row', layout: 'horizontal', gap: GAPX, alignItems: 'start', children: [
      ...(labelW ? [txt(r, { width: labelW, fill: '$non-interactive-foreground-secondary' })] : []),
      ...cols.map((col, ci) => { const c = at(r, col); return cell(c, colW[ci], rowH[ri], wrapped && c ? value(c, across) : null) }),
    ] }))
  }
  // Variants named in words, not properties ("with an icon"): a row of their own, captioned.
  if (loose.length) grid.push({ type: 'frame', id: nid(), name: 'Other', layout: 'horizontal', gap: GAPX, alignItems: 'start', children: loose.map((c) => cell(c, Math.max(80, c.w), c.h + 28, c.name || 'Default')) })
  const gridW = Math.max(
    named.length ? labelW + (labelW ? GAPX : 0) + colW.reduce((s, w) => s + w, 0) + GAPX * (cols.length - 1) : 0,
    loose.reduce((s, c) => s + Math.max(80, c.w), 0) + GAPX * Math.max(0, loose.length - 1),
  )
  const gridH = (named.length && !wrapped ? 16 + GAPY : 0) + rowH.reduce((s, h) => s + h, 0) * (named.length ? 1 : 0) + GAPY * Math.max(0, (named.length ? rows.length : 0) - 1) + (loose.length ? (named.length ? GAPY : 0) + Math.max(...loose.map((c) => c.h + 28)) : 0)
  const w = gridW + 2 * PAD, h = gridH + 2 * PAD
  // The set: Figma draws its component sets with a purple outline, so this does too.
  const set = { type: 'frame', id: nid(), name: b.title, layout: 'vertical', gap: GAPY, padding: PAD, cornerRadius: 8, stroke: '#9747ff', strokeWidth: 1, children: grid, context: `${b.components.length} variants of ${b.title}. Properties: ${keys.join(', ') || 'none'}.` }
  return { set, w, h }
}

const PAGE_PAD = 64
const page = (name, intro, blocks) => {
  // A page: a title, a line under it, then each set under its own name.
  const w = Math.max(720, ...blocks.map((x) => x.w)) + 2 * PAGE_PAD
  const h = 2 * PAGE_PAD + 96 + blocks.reduce((s, x) => s + 40 + 36 + x.h, 0)
  return { w, h, frame: {
    type: 'frame', id: nid(), name, width: w, layout: 'vertical', gap: 40, padding: PAGE_PAD, fill: '$non-interactive-background-primary', theme: { mode: 'dark' }, cornerRadius: 24,
    metadata: { type: 'rost-page', page: name },
    children: [
      { type: 'frame', id: nid(), name: 'Header', layout: 'vertical', gap: 8, children: [
        txt(name, { name: 'Title', font: '$font-family-base', size: 40, weight: '500', fill: '$non-interactive-foreground-primary' }),
        txt(intro, { name: 'Intro', font: '$font-family-base', size: 16, width: w - 2 * PAGE_PAD }),
      ] },
      ...blocks.map((x) => ({ type: 'frame', id: nid(), name: x.title, layout: 'vertical', gap: 16, children: [txt(x.title, { name: 'Set name', font: '$font-family-base', size: 24, weight: '500', fill: '$non-interactive-foreground-secondary' }), x.set] })),
    ],
  } }
}

const byId = new Map(boards.map((b) => [b.id, b]))
const figmaPages = [...new Set(Object.values(FIGMA))].sort()
const pages = []
for (const fp of figmaPages) {
  const here = Object.keys(FIGMA).filter((id) => FIGMA[id] === fp && byId.has(id)).map((id) => byId.get(id))
  if (!here.length) continue
  const blocks = here.map((b) => ({ title: b.title, ...variantSet(b) }))
  const count = here.reduce((n, b) => n + b.components.length, 0)
  pages.push(page(fp[0].toUpperCase() + fp.slice(1), `The Figma page “${fp}”. ${count} variant${count === 1 ? '' : 's'}, each one a reusable component.`, blocks))
}
const codeOnly = boards.filter((b) => !FIGMA[b.id])
for (const b of codeOnly) pages.push(page(b.title, `Only in code, not in the Figma file. ${b.components.length} variant${b.components.length === 1 ? '' : 's'}.`, [{ title: b.title, ...variantSet(b) }]))

// On the canvas: the token pages along the top, the component pages in rows under them.
const children = []
const SPACE = 160, ROW = 7200
let x = 0, y = 0, tall = 0
const place = (p) => {
  if (x > 0 && x + p.w > ROW) { x = 0; y += tall + SPACE; tall = 0 }
  children.push({ ...p.frame, x, y })
  x += p.w + SPACE
  tall = Math.max(tall, p.h)
}
const tokenPages = foundations(tokens, nid)
for (const p of tokenPages) place(p)
x = ROW // the components start on a row of their own
for (const p of pages) place(p)

const doc = { version: '2.21', themes: { mode: ['dark', 'light'] }, variables, children }
mkdirSync(join(root, 'design'), { recursive: true })
writeFileSync(out, JSON.stringify(doc, null, 1) + '\n')
writeFileSync(join(work, 'shots.json'), JSON.stringify(shots, null, 1))
console.log(`\n${Object.keys(variables).length} variables, ${tokenPages.length} token pages, ${pages.length} component pages, ${boards.reduce((n, b) => n + b.components.length, 0)} components -> design/rost.lib.pen`)

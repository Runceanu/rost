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

const root = fileURLToPath(new URL('../', import.meta.url))
const font = process.env.ROST_FONT ?? join(homedir(), 'Library/Fonts/GeneralSans-Variable.ttf')
const out = join(root, 'design/rost.pen')
const work = join(root, 'test-results/pen')

// ── Tokens ──────────────────────────────────────────────────────────────
// Named as in code (the CSS variable without `--`), so `$rost:actions-primary-
// default-background` in a design is `var(--actions-primary-default-background)`.
const { tokens } = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'))
const hex = (v) => {
  const s = String(v).trim()
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return s.length === 4 ? '#' + [...s.slice(1)].map((c) => c + c).join('') : s
  const m = s.match(/^rgba?\(([^)]+)\)$/)
  if (!m) return null
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
  const h = (n) => Math.round(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ''}`
}
const numeric = (v) => (/^-?\d*\.?\d+(px)?$/.test(String(v).trim()) ? parseFloat(v) : null)
const variables = {}
const kinds = {}
for (const t of Object.values(tokens)) {
  const name = t.cssVar.replace(/^--/, '')
  const dark = String(t.value), light = t.light !== undefined ? String(t.light) : null
  const themed = (a, b) => (b === null || b === a ? a : [{ value: a, theme: { mode: 'dark' } }, { value: b, theme: { mode: 'light' } }])
  if (hex(dark)) { variables[name] = { type: 'color', value: themed(hex(dark), light && hex(light)) }; kinds[name] = 'color' }
  // Weights are strings in pen.dev ("500"); every other number is a plain number.
  else if (/font-weight/.test(name) && numeric(dark) !== null) { variables[name] = { type: 'string', value: themed(dark, light) }; kinds[name] = 'string' }
  // pen.dev reads an opacity variable as a percentage, so `opacity/gentle` (0.24) is 24 here.
  else if (/^opacity-/.test(name) && numeric(dark) !== null) { const pc = (v) => (v === null ? null : Math.round(numeric(v) * 10000) / 100); variables[name] = { type: 'number', value: themed(pc(dark), light && pc(light)) }; kinds[name] = 'number' }
  else if (numeric(dark) !== null) { variables[name] = { type: 'number', value: themed(numeric(dark), light && numeric(light)) }; kinds[name] = 'number' }
  else { variables[name] = { type: 'string', value: themed(dark, light) }; kinds[name] = 'string' }
}

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

  // The authored value that won, per property, for one element: `var(--x)` or a literal.
  const authored = async (nodeId) => {
    const { matchedCSSRules = [], inlineStyle } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId })
    const won = {}
    for (const m of matchedCSSRules) for (const p of m.rule.style.cssProperties) if (p.value && !p.disabled) won[p.name] = p.value
    for (const p of inlineStyle?.cssProperties ?? []) if (p.value && !p.disabled) won[p.name] = p.value
    return won
  }

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
    // Every element in the fixture, numbered, with its computed style and box.
    const els = await page.$$eval(`[data-fix="${i}"] *`, (list) => list.filter((el) => !el.parentElement?.closest('svg') && (el.checkVisibility?.() ?? true)).map((el, k) => {
      el.dataset.pk = String(k)
      const cs = getComputedStyle(el), r = el.getBoundingClientRect()
      const pick = ['display', 'position', 'flex-direction', 'flex-grow', 'align-items', 'justify-content', 'align-self', 'row-gap', 'column-gap',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'background-color', 'background-image', 'color', 'opacity', 'visibility',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-color', 'border-top-style',
        'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', 'box-shadow',
        'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'white-space', 'mask-image', '-webkit-mask-image',
        'backdrop-filter', 'filter', 'overflow', 'text-decoration-line', 'text-transform', 'outline-style', 'outline-width', 'outline-color', 'outline-offset', 'transform', 'text-decoration-color', 'vertical-align']
      const s = Object.fromEntries(pick.map((p) => [p, cs.getPropertyValue(p)]))
      // Text runs keep their place among the element's children: a summary's label sits after its chevron.
      const runs = [...el.childNodes].map((n, j) => (n.nodeType === 3 && n.textContent.trim() ? { idx: j, text: n.textContent.replace(/\s+/g, ' ').trim() } : null)).filter(Boolean)
      // A field's text is its value, not a text node.
      if (/^(textarea|input)$/i.test(el.tagName) && (el.value || el.placeholder)) runs.push({ idx: 0, text: el.value || el.placeholder })
      const text = runs.map((r) => r.text).join(' ')
      const idx = el.parentElement ? [...el.parentElement.childNodes].indexOf(el) : 0
      const parent = el.parentElement?.dataset.pk ?? null
      // An inline <svg> is one shape, read from its own markup, colours resolved.
      let inline = null
      if (el.tagName.toLowerCase() === 'svg') {
        const copy = el.cloneNode(true)
        const live = [el, ...el.querySelectorAll('*')], dup = [copy, ...copy.querySelectorAll('*')]
        live.forEach((n, j) => { const c = getComputedStyle(n); if (n.getAttribute('fill') === 'currentColor' || !n.getAttribute('fill')) dup[j].setAttribute('fill', c.fill); if (n.getAttribute('stroke') === 'currentColor') dup[j].setAttribute('stroke', c.stroke) })
        inline = copy.outerHTML
      }
      return { k, tag: el.tagName.toLowerCase(), cls: el.className?.baseVal ?? el.className, s, box: { x: r.x, y: r.y, w: r.width, h: r.height }, text, runs, idx, parent, src: el.tagName === 'IMG' ? el.currentSrc : null, inline, kids: el.children.length }
    }))
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: doc.nodeId, selector: `[data-fix="${i}"] *` })
    const by = new Map(els.map((e) => [String(e.k), e]))
    for (const nodeIdOf of nodeIds) {
      const { attributes = [] } = await cdp.send('DOM.getAttributes', { nodeId: nodeIdOf }).catch(() => ({}))
      const pk = attributes[attributes.indexOf('data-pk') + 1]
      if (by.has(pk)) by.get(pk).won = await authored(nodeIdOf)
    }
    // Chromium's own picture of it, for checking the pen.dev drawing against (bin/check-pen.mjs).
    const shot = `${id}-${i}.png`
    await (await page.$(`[data-fix="${i}"] > *`))?.screenshot({ path: join(work, 'shots', shot), omitBackground: false }).catch(() => {})
    if (forced) await cdp.send('CSS.forcePseudoState', { nodeId: forced, forcedPseudoClasses: [] })
    // The component's own root: past any plain wrapper the fixture puts around it.
    let top = els.find((e) => e.parent === null || !by.has(e.parent))
    while (top && !/(^|\s)rost-/.test(String(top.cls)) && els.filter((c) => c.parent === String(top.k)).length === 1) top = els.find((c) => c.parent === String(top.k))
    if (!top) continue
    const svgs = {}
    for (const e of els) {
      const url = e.src?.endsWith('.svg') ? e.src : (e.s['mask-image'] || e.s['-webkit-mask-image'] || '').match(/url\("?([^")]+\.svg)"?\)/)?.[1]
      if (url && !svgs[url]) svgs[url] = await page.evaluate(async (u) => (await fetch(u)).text(), url).catch(() => '')
      e.svg = e.inline ?? (url ? svgs[url] : null)
      e.masked = !e.src && !!url
    }
    const pen = toPen(top, els, svgs)
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

// ── DOM to pen.dev ──────────────────────────────────────────────────────
function toPen(top, els, svgs) {
  const kids = (e) => els.filter((c) => c.parent === String(e.k) && c.s.display !== 'none')
  const px = (v) => parseFloat(v) || 0
  // `var(--name)` as a pen.dev variable; anything else gives the computed fallback.
  const ref = (e, props, fallback) => {
    for (const p of [].concat(props)) {
      const m = e.won?.[p]?.match(/^var\(--([\w-]+)\)$/)
      if (m && kinds[m[1]]) return `$${m[1]}`
    }
    return fallback
  }
  const colour = (e, props, computed) => {
    const v = ref(e, props, null)
    if (v && kinds[v.slice(1)] === 'color') return v
    const h = hex(computed)
    return h && !/^#[0-9a-f]{6}00$/i.test(h) ? h : null
  }
  const num = (e, props, computed) => { const v = ref(e, props, null); return v && kinds[v.slice(1)] === 'number' ? v : Math.round(px(computed) * 100) / 100 }
  const inherited = (e, prop) => { for (let x = e; x; x = by(x.parent)) if (x.won?.[prop]) return x; return e }
  const by = (k) => (k === null ? null : els.find((c) => String(c.k) === k))
  const measured = new WeakMap()
  let rootEl = null
  const singleLine = new WeakSet()

  const textNode = (e, content) => {
    const fs = px(e.s['font-size']), lh = e.s['line-height'] === 'normal' ? null : px(e.s['line-height'])
    // pen.dev has no text-transform, so an eyebrow's capitals go into the text itself.
    const tt = e.s['text-transform']
    if (tt === 'uppercase') content = content.toUpperCase()
    else if (tt === 'lowercase') content = content.toLowerCase()
    const t = { type: 'text', id: nid(), name: 'Text', content,
      fill: colour(inherited(e, 'color'), 'color', e.s.color) ?? '#ededed',
      fontFamily: ref(inherited(e, 'font-family'), 'font-family', e.s['font-family'].split(',')[0].replace(/['"]/g, '').trim()),
      fontSize: num(inherited(e, 'font-size'), 'font-size', e.s['font-size']),
      fontWeight: ref(inherited(e, 'font-weight'), 'font-weight', e.s['font-weight']) }
    if (lh) t.lineHeight = Math.round((lh / fs) * 1000) / 1000
    const ls = px(e.s['letter-spacing'])
    if (ls || ref(inherited(e, 'letter-spacing'), 'letter-spacing', null)) t.letterSpacing = num(inherited(e, 'letter-spacing'), 'letter-spacing', e.s['letter-spacing'])
    if (e.s['text-align'] === 'center') t.textAlign = 'center'
    if (e.s['text-align'] === 'right' || e.s['text-align'] === 'end') t.textAlign = 'right'
    // An underline set on a link reaches the text inside it; a transparent one is hidden.
    for (let x = e; x; x = by(x.parent)) if (x.s['text-decoration-line'].includes('underline')) { if (!/^rgba\(0, 0, 0, 0\)$|transparent/.test(x.s['text-decoration-color'])) t.underline = true; break }
    // One line in the browser stays one line: General Sans's stand-in runs wider and would wrap.
    if (!lh || e.box.h < lh * 1.5) singleLine.add(t)
    return t
  }

  // An SVG file's shapes as one path geometry each, fitted inside the box the way `contain` fits.
  const paths = (svg, w, h, fill) => {
    svg = svg.replace(/<(defs|clipPath|mask)\b[\s\S]*?<\/\1>/g, '')
    const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${w} ${h}`).split(/[ ,]+/).map(Number)
    const shapes = []
    for (const m of svg.matchAll(/<path\b([^>]*)>/g)) { const d = m[1].match(/\sd="([^"]+)"/)?.[1]; if (d) shapes.push({ d, a: m[1] }) }
    for (const m of svg.matchAll(/<circle\b([^>]*)>/g)) { const g = (k) => Number(m[1].match(new RegExp(`\\s${k}="([^"]+)"`))?.[1] ?? 0); const [cx, cy, r] = [g('cx'), g('cy'), g('r')]; shapes.push({ d: `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, a: m[1] }) }
    for (const m of svg.matchAll(/<rect\b([^>]*)>/g)) { const g = (k) => Number(m[1].match(new RegExp(`\\s${k}="([^"]+)"`))?.[1] ?? 0); shapes.push({ d: `M${g('x')} ${g('y')}h${g('width')}v${g('height')}h${-g('width')}Z`, a: m[1] }) }
    const s = Math.min(w / vb[2], h / vb[3]), pw = vb[2] * s, ph = vb[3] * s
    return shapes.map(({ d, a }) => {
      const own = a.match(/\sfill="([^"]+)"/)?.[1]
      const p = { type: 'path', id: nid(), name: 'Shape', layoutPosition: 'absolute', x: Math.round((w - pw) / 2 * 100) / 100, y: Math.round((h - ph) / 2 * 100) / 100, width: Math.round(pw * 100) / 100, height: Math.round(ph * 100) / 100, viewBox: vb, geometry: d, fill: fill ?? (own && own !== 'none' && own !== 'currentColor' ? hex(own) ?? own : '#ededed') }
      if (own === 'none') delete p.fill
      if (/fill-rule="evenodd"/.test(a)) p.fillRule = 'evenodd'
      const stroke = a.match(/\sstroke="([^"]+)"/)?.[1]
      if (stroke && stroke !== 'none') { p.stroke = fill ?? hex(stroke) ?? stroke; p.strokeWidth = Number(a.match(/stroke-width="([^"]+)"/)?.[1] ?? 1) * s; if (!own) delete p.fill }
      return p
    })
  }

  const node = (e, parentFlex) => {
    const sizeDeclared = (p) => e.won?.[p] && !/auto|fit-content|max-content|min-content/.test(e.won[p])
    const flex = /flex/.test(e.s.display)
    const childEls = kids(e)
    const name = String(e.cls || e.tag).split(/\s+/).find((c) => /^rost-/.test(c))?.replace(/^rost-[a-z0-9-]+?__/, '').replace(/^rost-/, '') ?? e.tag
    const boxy = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width'].some((p) => px(e.s[p]) > 0)
      || hex(e.s['background-color']) && !/00$/.test(hex(e.s['background-color']).slice(7)) || e.s['box-shadow'] !== 'none' || e.svg || px(e.s['border-top-left-radius']) > 0
    // A bare run of text: a text node, no frame around it.
    if (!childEls.length && e.text && !boxy && !sizeDeclared('width') && !sizeDeclared('height')) {
      const t = textNode(e, e.text)
      t.name = name
      if (e.s.opacity !== '1') t.opacity = ref(e, 'opacity', Number(e.s.opacity))
      return place(t, e, parentFlex)
    }
    const f = { type: 'frame', id: nid(), name }
    const fill = e.masked ? null : colour(e, ['background', 'background-color'], e.s['background-color'])
    if (fill) f.fill = fill
    const radii = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'].map((p) => num(e, [p, 'border-radius'], e.s[p]))
    if (radii.some((r) => r !== 0)) f.cornerRadius = radii.every((r) => r === radii[0]) ? radii[0] : radii
    const bw = ['top', 'right', 'bottom', 'left'].map((side) => (e.s[`border-${side}-style`] === 'none' && side === 'top' ? 0 : px(e.s[`border-${side}-width`])))
    if (bw.some(Boolean) && e.s['border-top-style'] !== 'none') {
      f.stroke = colour(e, ['border-color', 'border-top-color'], e.s['border-top-color']) ?? '#ededed'
      const w0 = ref(e, ['border-width', 'border-top-width'], null)
      f.strokeWidth = bw.every((b) => b === bw[0]) ? (w0 && kinds[w0.slice(1)] === 'number' ? w0 : bw[0]) : { top: bw[0], right: bw[1], bottom: bw[2], left: bw[3] }
      f.strokeAlignment = 'inner'
    }
    // An inset shadow with no blur is how Rost draws a stroke that takes no room.
    const shadow = e.s['box-shadow']
    if (shadow && shadow !== 'none') {
      const effects = []
      for (const sh of shadow.split(/,(?![^(]*\))/)) {
        const colourPart = sh.match(/rgba?\([^)]+\)|#[0-9a-f]+/i)?.[0]
        const [x, y, blur = 0, spread = 0] = sh.replace(colourPart ?? '', '').replace('inset', '').trim().split(/\s+/).map(px)
        const c = hex(colourPart)
        const fromVar = e.won?.['box-shadow']?.match(/var\(--([\w-]+)\)\s*$/)?.[1]
        const col = fromVar && kinds[fromVar] === 'color' ? `$${fromVar}` : c
        // `inset 0 0 0 1px`: the same width all round.
        const widthVar = e.won?.['box-shadow']?.match(/var\(--(spacing-outline-[\w-]+)\)\s+var\(--[\w-]+\)\s*$/)?.[1]
        if (sh.includes('inset') && !blur && spread && !x && !y && !f.stroke) { f.stroke = col; f.strokeAlignment = 'inner'; f.strokeWidth = widthVar && kinds[widthVar] ? `$${widthVar}` : spread }
        else if (sh.includes('inset') && !blur && !spread && !f.stroke) { f.stroke = col; f.strokeAlignment = 'inner'; f.strokeWidth = { top: Math.max(0, y), right: Math.max(0, -x), bottom: Math.max(0, -y), left: Math.max(0, x) } }
        else effects.push({ type: 'shadow', shadowType: sh.includes('inset') ? 'inner' : 'outer', offset: { x, y }, blur, color: col })
      }
      if (effects.length) f.effect = effects
    }
    // A CSS outline (a focused row) is a stroke outside the box.
    if (!f.stroke && e.s['outline-style'] !== 'none' && px(e.s['outline-width']) > 0) {
      f.stroke = colour(e, ['outline-color', 'outline'], e.s['outline-color']) ?? '#ededed'
      f.strokeWidth = num(e, ['outline-width'], e.s['outline-width'])
      f.strokeAlignment = px(e.s['outline-offset']) < 0 ? 'inner' : 'outer'
    }
    const blur = e.s['backdrop-filter'].match(/blur\(([\d.]+)px\)/)
    if (blur) f.effect = [...(f.effect ?? []), { type: 'background_blur', radius: Number(blur[1]) }]
    if (e.s.opacity !== '1') f.opacity = ref(e, 'opacity', Number(e.s.opacity))
    if (e.s.overflow === 'hidden' || e.s.overflow === 'clip') f.clip = true
    const pad = ['top', 'right', 'bottom', 'left'].map((side) => num(e, [`padding-${side}`, 'padding'], e.s[`padding-${side}`]))
    if (pad.some((p) => p !== 0)) f.padding = pad.every((p) => p === pad[0]) ? pad[0] : pad[0] === pad[2] && pad[1] === pad[3] ? [pad[0], pad[1]] : pad

    // Children: in flow when the CSS is flex (or a plain block stack), absolute when the CSS says so.
    const inFlow = childEls.filter((c) => c.s.position !== 'absolute' && c.s.position !== 'fixed')
    if (flex) {
      f.layout = e.s['flex-direction'].startsWith('column') ? 'vertical' : 'horizontal'
      const g = f.layout === 'horizontal' ? 'column-gap' : 'row-gap'
      if (px(e.s[g])) f.gap = num(e, [g, 'gap'], e.s[g])
      const jc = { center: 'center', 'flex-end': 'end', end: 'end', 'space-between': 'space_between', 'space-around': 'space_around' }[e.s['justify-content']]
      if (jc) f.justifyContent = jc
      const ai = { center: 'center', 'flex-end': 'end', end: 'end' }[e.s['align-items']]
      if (ai) f.alignItems = ai
    } else if (e.s.display === 'table-row') {
      // A table row lays its cells side by side, each as wide as the table made it.
      f.layout = 'horizontal'
      f.alignItems = 'center'
    } else if (e.s.display === 'table-cell') {
      // A cell is as tall as its row and puts its content where vertical-align says.
      f.layout = 'vertical'
      if (e.s['vertical-align'] === 'middle') f.justifyContent = 'center'
      if (e.s['vertical-align'] === 'bottom') f.justifyContent = 'end'
    } else if (inFlow.length > 1 || (inFlow.length && !e.text)) {
      f.layout = 'vertical'
    } else if (!inFlow.length && !e.text) {
      f.layout = 'none'
    }
    const children = []
    // Text right in a box (a label in a padded pill): a text node inside the frame.
    if (e.text && (!f.layout || f.layout === 'none')) { f.layout = 'horizontal'; f.alignItems = f.alignItems ?? 'center' }
    const flow = f.layout && f.layout !== 'none' ? { dir: f.layout, align: e.s['align-items'], box: e.box, pad } : null
    const items = [...e.runs.map((r) => ({ idx: r.idx, run: r })), ...childEls.map((c) => ({ idx: c.idx, el: c }))].sort((a, b) => a.idx - b.idx)
    // row-reverse puts the last child first; pen.dev has no reverse, so the order flips.
    if (flex && e.s['flex-direction'].endsWith('reverse')) items.reverse()
    for (const it of items) {
      if (it.run) {
        const t = textNode(e, it.run.text)
        t.name = 'Label'
        // A field's text wraps inside the field, as wide as the box.
        if (/^(textarea|input)$/.test(e.tag)) { t.textGrowth = 'fixed-width'; t.width = 'fill_container' }
        children.push(t)
      } else { const n = node(it.el, flow); if (n) children.push(n) }
    }
    if (e.svg) {
      // A turned icon (an open disclosure's chevron): the shape turns about its centre.
      const m = e.s.transform.match(/^matrix\(([^)]+)\)/)?.[1].split(',').map(Number)
      const deg = m ? Math.round(Math.atan2(m[1], m[0]) * 180 / Math.PI) : 0
      for (const p of paths(e.svg, e.box.w, e.box.h, e.masked ? colour(e, ['background', 'background-color'], e.s['background-color']) : null)) {
        if (deg) {
          const r = -deg * Math.PI / 180, cx = p.x + p.width / 2, cy = p.y + p.height / 2
          p.rotation = -deg
          p.x = Math.round((cx - (Math.cos(r) * p.width / 2 + Math.sin(r) * p.height / 2)) * 100) / 100
          p.y = Math.round((cy - (-Math.sin(r) * p.width / 2 + Math.cos(r) * p.height / 2)) * 100) / 100
        }
        children.push(p)
      }
    }
    // A layer that covers the whole component (Button's background, Chip's outline) becomes the
    // component's own fill and stroke, so the component still grows when its label does: pen.dev
    // can't stretch an absolute layer with its parent. A layer's own opacity moves onto the paint,
    // as a gradient of one colour, the only paint in pen.dev that takes an opacity.
    const paint = (c, o) => (o === undefined ? c : { type: 'gradient', gradientType: 'linear', opacity: o, colors: [{ color: c, position: 0 }, { color: c, position: 1 }] })
    for (const c of [...children]) {
      const full = c.type === 'frame' && c.layoutPosition === 'absolute' && !c.children && Math.abs(c.x) < 0.5 && Math.abs(c.y) < 0.5 && Math.abs(c.width - e.box.w) < 1 && Math.abs(c.height - e.box.h) < 1
      if (!full || (c.fill && f.fill) || (c.stroke && f.stroke) || (!c.fill && !c.stroke) || c.effect) continue
      if (c.fill) f.fill = paint(c.fill, c.opacity)
      if (c.stroke) { f.stroke = paint(c.stroke, c.opacity); f.strokeWidth = c.strokeWidth; f.strokeAlignment = c.strokeAlignment }
      if (c.cornerRadius !== undefined && f.cornerRadius === undefined) f.cornerRadius = c.cornerRadius
      children.splice(children.indexOf(c), 1)
    }
    if (children.length) f.children = children
    if (e.svg && f.layout !== 'none') f.layout = 'none'
    // Size: the token or number the CSS sets, else hug the content.
    const fixedW = sizeDeclared('width') || e.s.display === 'table-cell' || sizeDeclared('min-width') && !childEls.length || (!children.some((c) => c.layoutPosition !== 'absolute') && !e.text)
    const fixedH = sizeDeclared('height') || e.s.display === 'table-cell' || (!children.some((c) => c.layoutPosition !== 'absolute') && !e.text)
    f.width = fixedW ? Math.round(e.box.w * 100) / 100 : 'fit_content'
    f.height = fixedH ? Math.round(e.box.h * 100) / 100 : 'fit_content'
    // pen.dev drops a variable on width and height, so sizes are numbers; the token is noted in the node's context.
    const sized = ['width', 'height'].map((p) => sizeDeclared(p) && ref(e, p, null)).filter(Boolean)
    if (sized.length) f.context = `size: ${sized.map((v) => v.slice(1)).join(', ')}`
    if (f.layout === 'none' && f.width === 'fit_content') f.width = Math.round(e.box.w * 100) / 100
    if (f.layout === 'none' && f.height === 'fit_content') f.height = Math.round(e.box.h * 100) / 100
    // A child can only fill a parent that has a size of its own. In one that
    // hugs its content, pen.dev would squeeze it to nothing, so it keeps the width it had.
    for (const c of f.children ?? []) for (const axis of ['width', 'height'])
      if (c[axis] === 'fill_container' && f[axis] === 'fit_content') {
        if (c.type === 'text' && axis === 'width' && singleLine.has(c)) { delete c.width; delete c.textGrowth }
        else c[axis] = measured.get(c)?.[axis] ?? 'fit_content'
      }
    return place(f, e, parentFlex)
  }

  // Where a node sits in its parent: absolute with x/y, or in the flow, stretched where the CSS stretches it.
  const place = (n, e, parent) => {
    measured.set(n, { width: Math.round(e.box.w * 100) / 100, height: Math.round(e.box.h * 100) / 100 })
    // The component's own root keeps its own sizing: it hugs, or has the size its CSS gives it.
    if (e === rootEl) return n
    const abs = e.s.position === 'absolute' || e.s.position === 'fixed' || !parent
    const p = by(e.parent)
    if (abs && p) {
      n.layoutPosition = parent ? 'absolute' : undefined
      n.x = Math.round((e.box.x - p.box.x) * 100) / 100
      n.y = Math.round((e.box.y - p.box.y) * 100) / 100
      if (n.type === 'frame' || n.type === 'path') { n.width = Math.round(e.box.w * 100) / 100; n.height = Math.round(e.box.h * 100) / 100 }
      if (!parent) delete n.layoutPosition
      return n
    }
    if (parent) {
      const main = parent.dir === 'horizontal' ? 'width' : 'height', cross = parent.dir === 'horizontal' ? 'height' : 'width'
      if (Number(e.s['flex-grow']) > 0) { if (n.type === 'text') { n.textGrowth = 'fixed-width'; n.width = 'fill_container' } else n[main] = 'fill_container' }
      const stretch = (e.s['align-self'] === 'stretch' || (e.s['align-self'] === 'auto' && /normal|stretch/.test(parent.align)))
      if (stretch && n.type === 'frame' && n[cross] === 'fit_content') n[cross] = 'fill_container'
      if (stretch && n.type === 'text' && cross === 'width') { n.textGrowth = 'fixed-width'; n.width = 'fill_container' }
    }
    return n
  }

  rootEl = top
  const n = node(top, null)
  delete n.x; delete n.y
  return n
}

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

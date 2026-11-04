// Shared by bin/build-pen.mjs (Rost's own library) and bin/build-pen-pages.mjs
// (an app's pages): tokens as pen.dev variables, a page's DOM captured with
// the authored value of every property, and that DOM turned into pen.dev nodes.

export const hex = (v) => {
  const s = String(v).trim()
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return s.length === 4 ? '#' + [...s.slice(1)].map((c) => c + c).join('') : s
  const h = (n) => Math.round(n).toString(16).padStart(2, '0')
  // What Chrome gives for a color-mix(): color(srgb 0 0 0 / 0.48), channels from 0 to 1.
  const c = s.match(/^color\(srgb ([^)]+)\)$/)
  if (c) { const [r, g, b, a = 1] = c[1].split(/[ /]+/).filter(Boolean).map(Number); return `#${h(r * 255)}${h(g * 255)}${h(b * 255)}${a < 1 ? h(a * 255) : ''}` }
  const m = s.match(/^rgba?\(([^)]+)\)$/)
  if (!m) return null
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ''}`
}
export const numeric = (v) => (/^-?\d*\.?\d+(px)?$/.test(String(v).trim()) ? parseFloat(v) : null)

/** tokens.json's tokens as pen.dev variables, and what kind each one is. */
export function penTokens(tokens) {
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
  return { variables, kinds }
}

/**
 * Every visible element under `scope`, with its computed style, box, text and
 * the authored value that won for each property (Chrome's own matched styles).
 */
export async function capture(page, cdp, scope, doc) {
  // The caller's document, so node ids it already holds (a forced state) stay valid.
  doc ??= (await cdp.send('DOM.getDocument', { depth: -1 })).root
  // The authored value that won, per property, for one element: `var(--x)` or a literal.
  const authored = async (nodeId) => {
    const { matchedCSSRules = [], inlineStyle } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId })
    const won = {}
    for (const m of matchedCSSRules) for (const p of m.rule.style.cssProperties) if (p.value && !p.disabled) won[p.name] = p.value
    for (const p of inlineStyle?.cssProperties ?? []) if (p.value && !p.disabled) won[p.name] = p.value
    return won
  }
  // Every element in the fixture, numbered, with its computed style and box.
  const els = await page.$$eval(`${scope} *`, (list) => list.filter((el) => !el.parentElement?.closest('svg, pre') && (el.checkVisibility?.() ?? true)).map((el, k) => {
    el.dataset.pk = String(k)
    const cs = getComputedStyle(el), r = el.getBoundingClientRect()
    const pick = ['display', 'position', 'flex-direction', 'flex-grow', 'align-items', 'justify-content', 'align-self', 'row-gap', 'column-gap',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'background-color', 'background-image', 'color', 'opacity', 'visibility',
      'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-color', 'border-top-style',
      'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', 'box-shadow',
      'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'white-space', 'mask-image', '-webkit-mask-image',
      'backdrop-filter', 'filter', 'overflow', 'text-decoration-line', 'text-transform', 'outline-style', 'outline-width', 'outline-color', 'outline-offset', 'transform', 'text-decoration-color', 'vertical-align', 'object-fit', 'background-size', 'z-index', 'min-height']
    const s = Object.fromEntries(pick.map((p) => [p, cs.getPropertyValue(p)]))
    // Text runs keep their place among the element's children: a summary's label sits after its chevron.
    const runs = []
    ;[...el.childNodes].forEach((n, j) => {
      const last = runs[runs.length - 1]
      // A <br> is a line break inside the text around it ("Zero<br>to system").
      if (n.nodeName === 'BR') { if (last && last.end === j - 1) { last.text += '\n'; last.end = j } return }
      if (n.nodeType !== 3 || !n.textContent.trim()) return
      // Text nodes next to each other are one run, joined as written: React writes `+{amount}` as two.
      if (last && last.end === j - 1 && last.raw !== undefined) { last.raw += n.textContent; last.text = last.head + last.raw.replace(/\s+/g, ' ').trim(); last.end = j; return }
      const t = n.textContent.replace(/\s+/g, ' ').trim()
      if (last && last.end === j - 1 && last.text.endsWith('\n')) { last.head = last.text; last.raw = n.textContent; last.text += t; last.end = j } else runs.push({ idx: j, end: j, text: t, head: '', raw: n.textContent })
    })
    // A code block is one text with its lines and indents as they are. Its highlighting spans go:
    // a pen.dev text has one colour.
    if (el.tagName === 'PRE') runs.splice(0, runs.length, { idx: 0, end: 0, text: el.innerText.replace(/\n+$/, '') })
    // A field's text is its value, not a text node.
    if (/^(textarea|input)$/i.test(el.tagName) && (el.value || el.placeholder)) runs.push({ idx: 0, text: el.value || el.placeholder })
    const text = runs.map((r) => r.text).join(' ')
    const idx = el.parentElement ? [...el.parentElement.childNodes].indexOf(el) : 0
    // The nearest ancestor that's kept: a display: contents wrapper has no box, so its children move up.
    let up = el.parentElement
    while (up && up.dataset?.pk === undefined && getComputedStyle(up).display === 'contents') up = up.parentElement
    const parent = up?.dataset?.pk ?? null
    // An inline <svg> is one shape, read from its own markup, colours resolved.
    let inline = null
    if (el.tagName.toLowerCase() === 'svg') {
      const copy = el.cloneNode(true)
      const live = [el, ...el.querySelectorAll('*')], dup = [copy, ...copy.querySelectorAll('*')]
      live.forEach((n, j) => { const c = getComputedStyle(n); if (n.getAttribute('fill') === 'currentColor' || !n.getAttribute('fill')) dup[j].setAttribute('fill', c.fill); if (n.getAttribute('stroke') === 'currentColor') dup[j].setAttribute('stroke', c.stroke) })
      inline = copy.outerHTML
    }
    return { k, tag: el.tagName.toLowerCase(), cls: el.className?.baseVal ?? el.className, s, box: { x: r.x, y: r.y, w: r.width, h: r.height }, text, runs, idx, parent, src: el.tagName === 'IMG' ? el.currentSrc : el.tagName === 'VIDEO' ? el.poster || null : null, inline, kids: el.children.length }
  }))
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: doc.nodeId, selector: `${scope} *` })
  const by = new Map(els.map((e) => [String(e.k), e]))
  for (const nodeIdOf of nodeIds) {
    const { attributes = [] } = await cdp.send('DOM.getAttributes', { nodeId: nodeIdOf }).catch(() => ({}))
    const pk = attributes[attributes.indexOf('data-pk') + 1]
    if (by.has(pk)) by.get(pk).won = await authored(nodeIdOf)
  }
  const svgs = {}
  for (const e of els) {
    // An icon-sized SVG becomes shapes; a bigger SVG picture (a project's preview) stays a picture.
    // An SVG, as a file or inlined by the build.
    e.svgSrc = !!e.src && (/\.svg$/.test(e.src) || /^data:image\/svg\+xml/.test(e.src))
    if (e.svgSrc && Math.max(e.box.w, e.box.h) > 64) e.picture = true
    // A quoted URL runs to its closing quote: an inlined SVG has brackets of its own inside.
    const mask = e.s['mask-image'] || e.s['-webkit-mask-image'] || ''
    const masked = mask.match(/url\("([^"]+)"\)/)?.[1] ?? mask.match(/url\(([^)"]+)\)/)?.[1]
    const url = e.svgSrc && !e.picture ? e.src : masked && /^data:image\/svg\+xml|\.svg$/.test(masked) ? masked : undefined
    // An inlined SVG (data:image/svg+xml,...) is read from the URL itself.
    const inlined = url?.match(/^data:image\/svg\+xml(;base64)?,(.*)$/s)
    if (inlined && !svgs[url]) svgs[url] = inlined[1] ? Buffer.from(inlined[2], 'base64').toString('utf8') : decodeURIComponent(inlined[2])
    if (url && !svgs[url]) svgs[url] = await page.evaluate(async (u) => (await fetch(u)).text(), url).catch(() => '')
    e.svg = e.inline ?? (url ? svgs[url] : null)
    e.masked = !e.src && !!url
  }
  return els
}

// ── DOM to pen.dev ──────────────────────────────────────────────────────
export function toPen(top, els, { kinds, prefix = '', nid, image }) {
  // A variable as this file names it: `$name` in Rost's own file, `$rost:name` in a file that imports it.
  const bare = (v) => v.slice(1 + prefix.length)
  const kids = (e) => els.filter((c) => c.parent === String(e.k) && c.s.display !== 'none' && c.tag !== 'br')
  const px = (v) => parseFloat(v) || 0
  // `var(--name)` as a pen.dev variable; anything else gives the computed fallback.
  const ref = (e, props, fallback) => {
    for (const p of [].concat(props)) {
      const m = e.won?.[p]?.match(/^var\(--([\w-]+)\)$/)
      if (m && kinds[m[1]]) return `$${prefix}${m[1]}`
    }
    return fallback
  }
  const colour = (e, props, computed) => {
    const v = ref(e, props, null)
    if (v && kinds[bare(v)] === 'color') return v
    const h = hex(computed)
    return h && !/^#[0-9a-f]{6}00$/i.test(h) ? h : null
  }
  const num = (e, props, computed) => { const v = ref(e, props, null); return v && kinds[bare(v)] === 'number' ? v : Math.round(px(computed) * 100) / 100 }
  const inherited = (e, prop) => { for (let x = e; x; x = by(x.parent)) if (x.won?.[prop]) return x; return e }
  const by = (k) => (k === null ? null : els.find((c) => String(c.k) === k))
  const measured = new WeakMap()
  // A one-line text that fills a cell (a grid's 1fr column) keeps the cell's size without being
  // allowed to wrap: it sits, unwrapped, in a frame as big as the cell, aligned as its text-align says.
  const cell = (n, box) => {
    if (n.type !== 'text' || !singleLine.has(n)) return n
    delete n.width; delete n.textGrowth
    const f = { type: 'frame', id: nid(), name: n.name, layout: 'horizontal', alignItems: 'center', width: Math.round(box.w * 100) / 100, height: Math.round(box.h * 100) / 100, children: [n] }
    if (n.textAlign === 'right') f.justifyContent = 'end'
    if (n.textAlign === 'center') f.justifyContent = 'center'
    return f
  }
  // Whether flex layout, as converted, puts these children where the browser put them.
  const explains = (f, e, pairs) => {
    const H = f.layout === 'horizontal'
    const pad = ['top', 'right', 'bottom', 'left'].map((side) => px(e.s[`padding-${side}`]) + px(e.s[`border-${side}-width`]))
    const c0 = H ? e.box.x + pad[3] : e.box.y + pad[0], c1 = H ? e.box.x + e.box.w - pad[1] : e.box.y + e.box.h - pad[2]
    const x0 = H ? e.box.y + pad[0] : e.box.x + pad[3], x1 = H ? e.box.y + e.box.h - pad[2] : e.box.x + e.box.w - pad[1]
    const at = (el) => (H ? [el.box.x, el.box.x + el.box.w, el.box.y, el.box.y + el.box.h] : [el.box.y, el.box.y + el.box.h, el.box.x, el.box.x + el.box.w])
    const boxes = pairs.map(({ el }) => at(el))
    const gaps = boxes.slice(1).map((b, i) => b[0] - boxes[i][1])
    if (gaps.some((g) => Math.abs(g - (gaps[0] ?? 0)) > 1)) return false
    const gap = gaps[0] ?? 0
    const want = typeof f.gap === 'number' ? f.gap : f.gap ? gap : 0
    if (Math.abs(gap - want) > 1) { if (typeof f.gap === 'string') return false; if (gap > 0.5) f.gap = Math.round(gap * 100) / 100; else delete f.gap }
    const lead = boxes[0][0] - c0, trail = c1 - boxes[boxes.length - 1][1]
    const j = f.justifyContent ?? 'start'
    const mainOk = j === 'center' ? Math.abs(lead - trail) < 1.5 : j === 'end' ? trail < 1.5 : j === 'space_between' ? lead < 1.5 && trail < 1.5 : lead < 1.5
    if (!mainOk) {
      // A hugging frame has no room to spare, so its children start at the start whatever it says.
      if (Math.abs(lead - trail) < 1.5 && j === 'start') f.justifyContent = 'center'
      else return false
    }
    const fits = (a) => boxes.every((b) => a === 'center' ? Math.abs((b[2] - x0) - (x1 - b[3])) < 1.5 : a === 'end' ? x1 - b[3] < 1.5 : b[2] - x0 < 1.5)
    const a = f.alignItems ?? 'start'
    if (fits(a)) return true
    for (const other of ['start', 'center', 'end']) if (fits(other)) { if (other === 'start') delete f.alignItems; else f.alignItems = other; return true }
    return false
  }
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
    const inner = e.box.h - ['top', 'bottom'].reduce((n, side) => n + px(e.s[`padding-${side}`]) + px(e.s[`border-${side}-width`]), 0)
    // Explicit line breaks count as lines of their own: "Zero<br>to system" is two lines that don't wrap.
    const lines = content.split('\n').length
    if (!lh || inner < lh * (lines + 0.5)) singleLine.add(t)
    return t
  }

  // An SVG file's shapes as one path geometry each, fitted inside the box the way `contain` fits.
  const paths = (svg, w, h, fill) => {
    // Vite's inlined SVGs quote attributes with ' instead of ".
    svg = svg.replace(/=\s*'([^']*)'/g, '="$1"').replace(/<(defs|clipPath|mask)\b[\s\S]*?<\/\1>/g, '')
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
    // Something the page draws scaled (a preview in a card) is a picture of itself: pen.dev can't scale.
    if (e.snapshot) return place({ type: 'frame', id: nid(), name: 'Preview', layout: 'none', width: Math.round(e.box.w * 100) / 100, height: Math.round(e.box.h * 100) / 100, fill: { type: 'image', url: e.snapshot, mode: 'stretch' } }, e, parentFlex)
    const sizeDeclared = (p) => e.won?.[p] && !/auto|fit-content|max-content|min-content/.test(e.won[p])
    const flex = /flex/.test(e.s.display)
    let childEls = kids(e)
    // A sentence made of inline spans (a headline with a bright phrase) is one text in pen.dev,
    // in the paragraph's own colour: a pen.dev text has one fill, and separate blocks wouldn't wrap as one.
    // A Rost component (a Link in a sentence) stays itself.
    const inline = (c) => /^inline$/.test(c.s.display) && !c.svg && !c.src && !els.some((d) => d.parent === String(c.k)) && !/(^|\s)rost-[a-z0-9-]+(\s|$)/.test(String(c.cls))
    if (childEls.length && childEls.every(inline) && !/flex|grid/.test(e.s.display)) {
      const parts = [...e.runs.map((r) => ({ idx: r.idx, text: r.text })), ...childEls.map((c) => ({ idx: c.idx, text: c.text }))].sort((a, b) => a.idx - b.idx)
      e.runs = [{ idx: 0, end: 0, text: parts.map((x) => x.text).join(' ').replace(/\s+([.,;:!?])/g, '$1') }]
      e.text = e.runs[0].text
      childEls = []
    }
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
    // A linear gradient (Thumbs' shadow): its stops, each bound to its token where the CSS names one.
    const lg = e.s['background-image'].match(/^linear-gradient\((.*)\)$/)
    if (lg) {
      const parts = (t) => t.split(/,(?![^(]*\))/).map((x) => x.trim())
      const got = parts(lg[1]), said = parts((e.won?.['background-image'] || e.won?.background || '').replace(/\s+/g, ' ').match(/linear-gradient\((.*)\)/)?.[1] ?? '')
      const dirs = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }
      let deg = 180
      // Chrome leaves the default "to bottom" out of the computed value, not out of the authored one.
      if (/deg$|^to /.test(got[0])) { const d = got.shift(); deg = dirs[d] ?? parseFloat(d) }
      if (/deg$|^to /.test(said[0] ?? '')) said.shift()
      const stops = got.map((g, i) => {
        const col = g.match(/^(rgba?\([^)]+\)|color\([^)]+\)|#[0-9a-f]+)/i)?.[1]
        const pos = g.match(/(-?[\d.]+)%\s*$/)?.[1]
        const v = said[i]?.match(/^var\(--([\w-]+)\)/)?.[1]
        return { color: v && kinds[v] === 'color' ? `$${prefix}${v}` : hex(col), position: pos !== undefined ? Number(pos) / 100 : i / Math.max(1, got.length - 1) }
      }).filter((x) => x.color)
      // CSS turns clockwise from the top; pen.dev turns the other way.
      if (stops.length > 1) f.fill = [...(f.fill ? [f.fill] : []), { type: 'gradient', gradientType: 'linear', rotation: (360 - deg) % 360, colors: stops }]
    }
    // A photo (an <img>, a video's poster, a CSS background) is an image fill, placed the way
    // object-fit or background-size places it. `image` says where the file is from the .pen file.
    const raster = e.src && (!e.svgSrc || e.picture) ? e.src : !e.svg ? e.s['background-image'].match(/url\("?([^")]+)"?\)/)?.[1] : null
    const img = raster && image?.(raster)
    if (img) {
      const how = e.src ? e.s['object-fit'] : e.s['background-size']
      f.fill = [...(f.fill ? [f.fill] : []), { type: 'image', url: img, mode: /contain/.test(how) ? 'contain' : /^fill$|100% 100%/.test(how) ? 'stretch' : 'cover' }]
    }
    const radii = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'].map((p) => num(e, [p, 'border-radius'], e.s[p]))
    if (radii.some((r) => r !== 0)) f.cornerRadius = radii.every((r) => r === radii[0]) ? radii[0] : radii
    const bw = ['top', 'right', 'bottom', 'left'].map((side) => (e.s[`border-${side}-style`] === 'none' && side === 'top' ? 0 : px(e.s[`border-${side}-width`])))
    if (bw.some(Boolean) && e.s['border-top-style'] !== 'none') {
      f.stroke = colour(e, ['border-color', 'border-top-color'], e.s['border-top-color']) ?? '#ededed'
      const w0 = ref(e, ['border-width', 'border-top-width'], null)
      f.strokeWidth = bw.every((b) => b === bw[0]) ? (w0 && kinds[bare(w0)] === 'number' ? w0 : bw[0]) : { top: bw[0], right: bw[1], bottom: bw[2], left: bw[3] }
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
        const col = fromVar && kinds[fromVar] === 'color' ? `$${prefix}${fromVar}` : c
        // `inset 0 0 0 1px`: the same width all round.
        const widthVar = e.won?.['box-shadow']?.match(/var\(--(spacing-outline-[\w-]+)\)\s+var\(--[\w-]+\)\s*$/)?.[1]
        if (sh.includes('inset') && !blur && spread && !x && !y && !f.stroke) { f.stroke = col; f.strokeAlignment = 'inner'; f.strokeWidth = widthVar && kinds[widthVar] ? `$${prefix}${widthVar}` : spread }
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
    } else if (inFlow.length && inFlow.every((c) => /^inline/.test(c.s.display))) {
      // Inline things in a block run along a line: figures side by side, a badge after a title.
      f.layout = 'horizontal'
      f.alignItems = 'center'
    } else if (inFlow.length > 1 || (inFlow.length && !e.text)) {
      f.layout = 'vertical'
    } else if (!inFlow.length && !e.text) {
      f.layout = 'none'
    }
    const children = []
    const flowed = []
    // Text right in a box (a label in a padded pill): a text node inside the frame.
    if (e.text && (!f.layout || f.layout === 'none')) { f.layout = 'horizontal'; f.alignItems = f.alignItems ?? 'center' }
    const flow = f.layout && f.layout !== 'none' ? { dir: f.layout, align: e.s['align-items'], box: e.box, pad } : null
    const items = [...e.runs.map((r) => ({ idx: r.idx, run: r })), ...childEls.map((c) => ({ idx: c.idx, el: c }))].sort((a, b) => a.idx - b.idx)
    // row-reverse puts the last child first; pen.dev has no reverse, so the order flips.
    if (flex && e.s['flex-direction'].endsWith('reverse')) items.reverse()
    if (/grid/.test(e.s.display)) {
      // pen.dev has no grid. Its items become rows, each item as big as the grid made it.
      f.layout = 'vertical'
      delete f.justifyContent; delete f.alignItems
      if (px(e.s['row-gap'])) f.gap = num(e, ['row-gap', 'gap'], e.s['row-gap'])
      const placed = childEls.filter((c) => c.s.position !== 'absolute' && c.s.position !== 'fixed')
      const rows = []
      for (const c of [...placed].sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x)) {
        // Items on one row overlap vertically, whatever they're aligned to.
        const r = rows.find((r) => c.box.y < r.y1 - 1 && c.box.y + c.box.h > r.y + 1)
        if (r) { r.items.push(c); r.y1 = Math.max(r.y1, c.box.y + c.box.h) } else rows.push({ y: c.box.y, y1: c.box.y + c.box.h, items: [c] })
      }
      // Rows reproduce the grid only when it starts top left and steps by its gaps. A grid that
      // centres its items (a sign-in card in the middle of the page) places each item where it was.
      const pads = ['top', 'right', 'bottom', 'left'].map((side) => px(e.s[`padding-${side}`]) + px(e.s[`border-${side}-width`]))
      const cx = e.box.x + pads[3], cy = e.box.y + pads[0], cg = px(e.s['column-gap']), rg = px(e.s['row-gap'])
      let rowsWork = true, at = cy
      for (const r of rows) {
        const items = [...r.items].sort((a, b) => a.box.x - b.box.x)
        if (Math.abs(items[0].box.x - cx) > 1.5 || Math.abs(Math.min(...items.map((c) => c.box.y)) - at) > 1.5) rowsWork = false
        items.slice(1).forEach((c, i) => { if (Math.abs(c.box.x - (items[i].box.x + items[i].box.w) - cg) > 1.5) rowsWork = false })
        at = r.y1 + rg
      }
      if (!rowsWork) {
        f.layout = 'none'
        delete f.gap
        for (const c of placed) {
          const n = node(c, null)
          if (!n) continue
          n.x = Math.round((c.box.x - e.box.x) * 100) / 100; n.y = Math.round((c.box.y - e.box.y) * 100) / 100
          if (n.type === 'frame') { n.width = Math.round(c.box.w * 100) / 100; n.height = Math.round(c.box.h * 100) / 100 }
          if (n.type === 'text' && !singleLine.has(n)) { n.textGrowth = 'fixed-width'; n.width = Math.round(c.box.w * 100) / 100 }
          delete n.layoutPosition
          const placedNode = cell(n, c.box)
          placedNode.x = n.x; placedNode.y = n.y
          if (placedNode !== n) { delete n.x; delete n.y }
          children.push(placedNode)
        }
        rows.length = 0
      }
      for (const r of rows) {
        const row = { type: 'frame', id: nid(), name: 'Row', layout: 'horizontal', children: [] }
        if (px(e.s['column-gap'])) row.gap = num(e, ['column-gap', 'gap'], e.s['column-gap'])
        for (const c of r.items.sort((a, b) => a.box.x - b.box.x)) {
          const n = node(c, { dir: 'horizontal', align: 'start', box: e.box, pad })
          if (!n) continue
          if (n.type === 'frame') { n.width = Math.round(c.box.w * 100) / 100; n.height = Math.round(c.box.h * 100) / 100 }
          if (n.type === 'text' && !singleLine.has(n)) { n.textGrowth = 'fixed-width'; n.width = Math.round(c.box.w * 100) / 100 }
          row.children.push(cell(n, c.box))
        }
        children.push(row)
      }
      for (const c of childEls.filter((c) => !placed.includes(c))) { const n = node(c, flow); if (n) children.push(n) }
    } else {
      for (const it of items) {
        if (it.run) {
          const t = textNode(e, it.run.text)
          t.name = 'Label'
          // A field's text wraps inside the field, as wide as the box.
          if (/^(textarea|input)$/.test(e.tag)) { t.textGrowth = 'fixed-width'; t.width = 'fill_container' }
          children.push(t)
        } else { const n = node(it.el, flow); if (n) { children.push(n); flowed.push({ n, el: it.el }) } }
      }
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
    // Flex can't say what margins and auto margins say. When a gap that's the same between every
    // child, and one alignment, don't put the children where the browser put them, they're placed
    // at their own positions instead. Rost's components use gaps, so they keep their flex layout.
    if ((f.layout === 'horizontal' || f.layout === 'vertical') && !e.runs.length && !/grid/.test(e.s.display)) {
      const inFlowPairs = flowed.filter(({ n }) => n.layoutPosition !== 'absolute')
      if (inFlowPairs.length && !explains(f, e, inFlowPairs)) {
        f.layout = 'none'
        for (const k of ['gap', 'justifyContent', 'alignItems']) delete f[k]
        for (const { n, el } of inFlowPairs) {
          n.x = Math.round((el.box.x - e.box.x) * 100) / 100
          n.y = Math.round((el.box.y - e.box.y) * 100) / 100
          if (n.type === 'frame' || n.type === 'path') { n.width = Math.round(el.box.w * 100) / 100; n.height = Math.round(el.box.h * 100) / 100 }
          if (n.type === 'text' && (n.width === 'fill_container' || n.textGrowth === 'fixed-width')) {
            if (singleLine.has(n)) { const w = cell(n, el.box); w.x = n.x; w.y = n.y; delete n.x; delete n.y; children[children.indexOf(n)] = w }
            else { n.textGrowth = 'fixed-width'; n.width = Math.round(el.box.w * 100) / 100 }
          }
        }
      }
    }
    // pen.dev draws later siblings on top. Something raised (z-index) or fixed, a nav over the page, goes last.
    // Only what's placed by position moves: a sticky header is in the flow and keeps its place.
    const raised = (n) => { const el = flowed.find((x) => x.n === n)?.el ?? null; return n.layoutPosition === 'absolute' && el && (el.s.position === 'fixed' || (el.s.position !== 'static' && Number(el.s['z-index']) > 0)) }
    children.sort((a, b) => Number(!!raised(a)) - Number(!!raised(b)))
    if (children.length) f.children = children
    if (e.svg && f.layout !== 'none') f.layout = 'none'
    // Size: the token or number the CSS sets, else hug the content.
    const fixedW = sizeDeclared('width') || e.s.display === 'table-cell' || sizeDeclared('min-width') && !childEls.length || (!children.some((c) => c.layoutPosition !== 'absolute') && !e.text)
    const fixedH = sizeDeclared('height') || e.s.display === 'table-cell' || px(e.s['min-height']) > 0 || (!children.some((c) => c.layoutPosition !== 'absolute') && !e.text)
    f.width = fixedW ? Math.round(e.box.w * 100) / 100 : 'fit_content'
    f.height = fixedH ? Math.round(e.box.h * 100) / 100 : 'fit_content'
    // pen.dev drops a variable on width and height, so sizes are numbers; the token is noted in the node's context.
    const sized = ['width', 'height'].map((p) => sizeDeclared(p) && ref(e, p, null)).filter(Boolean)
    if (sized.length) f.context = `size: ${sized.map((v) => bare(v)).join(', ')}`
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
    // Text that wrapped in the browser wraps at the same width here.
    if (n.type === 'text' && !singleLine.has(n) && n.width === undefined) { n.textGrowth = 'fixed-width'; n.width = Math.round(e.box.w * 100) / 100 }
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

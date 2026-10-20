#!/usr/bin/env node
/** Renders every contract, with its guidance, as one browsable reference page. */
import { writeFileSync, existsSync } from 'node:fs'
import { loadKit, KINDS, APP_LABEL, title, sourceLink, guidanceMarkdown, classify } from './lib/kit.mjs'

const kit = loadKit()
const contracts = kit

const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]))
const isColour = (v) => /^(#[0-9a-f]{3,8}|rgba?\()/i.test(String(v).trim())

/** Just enough markdown for guidance: ## headings, lists, paragraphs, **bold**, `code`. */
function md(src) {
  const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>')
  return src.split(/\n{2,}/).map((block) => {
    if (block.startsWith('## ')) return `<h3>${inline(block.slice(3))}</h3>`
    if (/^- /.test(block)) return `<ul>${block.split(/\n(?=- )/).map((li) => `<li>${inline(li.slice(2).replace(/\n/g, ' '))}</li>`).join('')}</ul>`
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`
  }).join('')
}

function valueCell(v) {
  const val = esc(v.value)
  const sw = isColour(v.value) ? `<span class="sw" style="--c:${esc(v.value)}"></span>` : ''
  return `${sw}<span class="v">${val}</span>`
}
function tokenCell(v, prop) {
  const kind = classify(prop, v)
  if (kind === 'token') return `<span class="tk">${esc(v.token)}</span>`
  if (kind === 'suggested') return `<span class="tk tk--suggest" title="Not bound at the source; this token fits">suggest ${esc(v.suggest)}</span>`
  if (kind === 'layout') return `<span class="tk tk--none">layout</span>`
  if (kind === 'sample') return `<span class="tk tk--none">just the Figma frame size</span>`
  if (kind === 'reasoned') return `<span class="tk tk--none" title="${esc(v.untokenised)}">on purpose: ${esc(v.untokenised)}</span>`
  return `<span class="tk tk--gap">no token yet</span>`
}

function invariantRows(inv) {
  const rows = []
  for (const [part, props] of Object.entries(inv))
    for (const [prop, v] of Object.entries(props))
      rows.push(`<tr><td class="pt">${esc(part)}</td><td class="pr">${esc(prop)}</td><td class="vc">${valueCell(v)}</td><td class="tc">${tokenCell(v, prop)}</td></tr>`)
  return rows.join('')
}

function variesBlocks(variants) {
  // Grouped by property: what a reader wants is "how does border-color move
  // across the matrix", not a rerun of the whole component per variant.
  const byProp = {}
  for (const [name, parts] of Object.entries(variants))
    for (const [part, props] of Object.entries(parts))
      for (const [prop, v] of Object.entries(props))
        (byProp[`${part}.${prop}`] ??= []).push({ name, v })
  return Object.entries(byProp).sort().map(([k, entries]) => `
      <div class="grp">
        <h4>${esc(k)}<span class="cnt">${entries.length}</span></h4>
        <div class="scroll"><table class="t">
          <tbody>${entries.map((e) => `<tr><td class="vn">${esc(e.name)}</td><td class="vc">${valueCell(e.v)}</td><td class="tc">${tokenCell(e.v, k.split('.').slice(1).join('.'))}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>`).join('')
}

const sections = kit.map((e) => {
  const { c, guidance: g } = e
  const nInv = Object.values(e.invariants).reduce((s, o) => s + Object.keys(o).length, 0)
  const nVar = Object.values(e.variantMap).reduce((s, o) => s + Object.values(o).reduce((t, x) => t + Object.keys(x).length, 0), 0)
  const axis = (k, vals) => `<div class="axis"><span class="ax">${esc(k)}</span>${vals.map((x) => `<span class="opt">${esc(x)}</span>`).join('')}</div>`
  const axes = Object.entries(c.props ?? {}).map(([k, v]) => axis(k, v.type === 'boolean' ? ['false', 'true'] : (v.values ?? [v.type]))).join('')
    + (c.states?.length ? axis('states', c.states) : '')
  const src = sourceLink(c)
  const impl = e.implementations.length
    ? e.implementations.map((i) => `<code class="impl">${esc(APP_LABEL[i.app] ?? i.app)}${i.root ? ' ' + esc(i.root) : ''}</code>`).join('')
    : `<span class="impl impl--none">not built yet</span>`
  const issues = [
    ...e.unresolved.map((t) => `<li>Token <code>${esc(t)}</code> does not resolve in tokens.css</li>`),
    ...(c.pending?.reason ? [`<li>Pending: ${esc(c.pending.reason)}</li>`] : []),
  ]
  const devs = e.deviations.map((d) => `<li><b>${esc(APP_LABEL[d.app] ?? d.app ?? 'All apps')}</b>: ${esc(d.what)} <span class="why">${esc(d.why)}</span></li>`)
  const notes = Object.entries(c.elements ?? {}).filter(([, el]) => el.notes).map(([part, el]) => ({ part, notes: el.notes }))
  return `
    <section class="comp" id="${e.id}">
      <header class="ch">
        <div class="kind">${esc(e.kind)}</div>
        <h2>${esc(title(e))}</h2>
        ${c.summary ? `<p class="sum">${esc(c.summary)}</p>` : ''}
        <div class="meta">
          ${src.href ? `<a class="node" href="${esc(src.href)}" target="_blank" rel="noreferrer">${esc(src.label)}</a>` : `<code class="node node--code">${esc(src.label)}</code>`}
          <span class="stat stat--${esc(c.status)}">contract: ${esc(c.status)}</span>
          ${existsSync(new URL(`../src/components/${e.id}/`, import.meta.url)) ? '<span class="stat stat--stable">in code</span>' : ''}
          <span class="stat">guidance: ${esc(g?.status ?? 'missing')}</span>
          ${impl}
          ${nVar ? `<span class="stat">${(c.variants ?? []).length} variants</span>` : ''}
        </div>
      </header>
      ${issues.length ? `<ul class="issues">${issues.join('')}</ul>` : ''}
      ${axes ? `<div class="axes">${axes}</div>` : ''}
      <div class="parts"><span class="lbl">Parts</span>${Object.keys(c.elements ?? {}).map((p) => `<span class="part">${esc(p)}</span>`).join('')}</div>
      ${notes.length ? `<dl class="notes">${notes.map((a) => `<dt>${esc(a.part)}</dt><dd>${esc(a.notes)}</dd>`).join('')}</dl>` : ''}

      ${g ? `<div class="guide">${md(guidanceMarkdown(g))}</div>` : ''}
      ${devs.length ? `<h3>Where code differs on purpose</h3><ul class="devs">${devs.join('')}</ul>` : ''}

      <h3>Never changes <span class="cnt">${nInv}</span></h3>
      <div class="scroll"><table class="t t--inv">
        <thead><tr><th>Part</th><th>Property</th><th>Value</th><th>Token</th></tr></thead>
        <tbody>${invariantRows(e.invariants)}</tbody>
      </table></div>

      ${nVar ? `<h3>Changes by variant <span class="cnt">${nVar}</span></h3>${variesBlocks(e.variantMap)}` : ''}
    </section>`
}).join('')

const built = kit.filter((e) => existsSync(new URL(`../src/components/${e.id}/`, import.meta.url)))
const nav = `<div class="nt">Rost</div><a href="#home">Home</a>` + KINDS.filter(([k]) => kit.some((e) => e.kind === k)).map(([k, label]) =>
  `<div class="nt">${label}</div>` + kit.filter((e) => e.kind === k)
    .map((e) => `<a href="#${e.id}">${esc(title(e))}<span>${e.unresolved.length || e.c.pending ? '!' : (e.c.variants ?? []).length || ''}</span></a>`).join('')).join('')
const totalVariants = contracts.reduce((s, { c }) => s + (c.variants ?? []).length, 0)
const totalValues = contracts.reduce((s, e) =>
  s + Object.values(e.invariants).reduce((t, o) => t + Object.keys(o).length, 0)
    + Object.values(e.variantMap).reduce((t, o) => t + Object.values(o).reduce((u, x) => u + Object.keys(x).length, 0), 0), 0)

writeFileSync(new URL('../reference.html', import.meta.url), `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rost Design System</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Dark-first: the kit itself is a dark system, so that is the primary palette. */
:root{
  --ground:#08090a; --surface:#101211; --raised:#161917; --line:#242926;
  --fg:#ededed; --fg-2:#a6aca8; --fg-3:#767b78;
  --accent:#00d669; --accent-dim:#00913a;
  --neg:#e93120; --pos:#00d669; --warn:#fda50d;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --body:'Instrument Sans',system-ui,-apple-system,sans-serif;
  --disp:'Archivo','Instrument Sans',system-ui,sans-serif;
}
@media (prefers-color-scheme:light){
  :root:not([data-theme="dark"]){
    --ground:#fbfbfa; --surface:#f3f4f2; --raised:#ffffff; --line:#e0e3e0;
    --fg:#12140f; --fg-2:#4c524e; --fg-3:#767b78; --accent:#00803a; --accent-dim:#00b450;
    --neg:#c1261a; --pos:#00803a; --warn:#a86a05;
  }
}
:root[data-theme="light"]{
  --ground:#fbfbfa; --surface:#f3f4f2; --raised:#ffffff; --line:#e0e3e0;
  --fg:#12140f; --fg-2:#4c524e; --fg-3:#767b78; --accent:#00803a; --accent-dim:#00b450;
  --neg:#c1261a; --pos:#00803a; --warn:#a86a05;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--fg);font-family:var(--body);
  font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
@media (min-width:1000px){.wrap{grid-template-columns:224px minmax(0,1fr)}}
nav{border-bottom:1px solid var(--line);padding:20px 24px}
@media (min-width:1000px){nav{position:sticky;top:0;align-self:start;height:100vh;overflow-y:auto;
  border-right:1px solid var(--line);border-bottom:none;padding:32px 20px}}
nav .nt{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--fg-3);margin-bottom:14px}
nav a{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;margin:0 -8px;border-radius:6px;
  color:var(--fg-2);text-decoration:none;font-size:14px}
nav a:hover{background:var(--surface);color:var(--fg)}
nav a span{font-family:var(--mono);font-size:11px;color:var(--fg-3);font-variant-numeric:tabular-nums}
main{padding:32px 24px 96px;max-width:980px}
@media (min-width:1000px){main{padding:56px 40px 120px}}
.home{border-bottom:1px solid var(--line);padding-bottom:36px;margin-bottom:8px;scroll-margin-top:24px}
.lede{font-size:clamp(18px,2.4vw,21px);line-height:1.45;color:var(--fg);max-width:46ch;margin:0 0 14px;text-wrap:pretty}
.home .sub{max-width:64ch}
.home .sub a{color:var(--accent)}
.home code{font-family:var(--mono);font-size:.9em}
.links{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 28px}
.links a{font-size:13.5px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);color:var(--fg-2);text-decoration:none}
.links a:hover{border-color:color-mix(in srgb,var(--accent) 40%,transparent);color:var(--fg)}
.links a:first-child{background:var(--accent);border-color:var(--accent);color:#060805}
h1{font-family:var(--disp);font-weight:700;letter-spacing:-.035em;line-height:1.02;
  font-size:clamp(34px,6vw,54px);margin:0 0 14px;text-wrap:balance}
.sub{color:var(--fg-2);max-width:62ch;margin:0 0 22px}
.counts{display:flex;flex-wrap:wrap;gap:26px}
.counts div{display:flex;flex-direction:column}
.counts b{font-family:var(--mono);font-size:24px;font-weight:500;color:var(--accent);
  font-variant-numeric:tabular-nums}
.counts span{font-size:12px;color:var(--fg-3);letter-spacing:.04em}
.comp{padding-top:52px;scroll-margin-top:24px}
.ch h2{font-family:var(--disp);font-weight:700;letter-spacing:-.025em;font-size:29px;margin:0 0 10px}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:18px}
.node,.impl,.stat{font-family:var(--mono);font-size:11.5px;padding:3px 8px;border-radius:5px;
  border:1px solid var(--line);color:var(--fg-2);text-decoration:none;white-space:nowrap}
.node{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 34%,transparent)}
.node:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)}
.impl--none{color:var(--fg-3);font-style:italic}
.stat{background:var(--surface);border-color:transparent;color:var(--fg-3)}
.axes{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
.axis{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ax{font-family:var(--mono);font-size:11px;color:var(--fg-3);min-width:96px}
.opt{font-size:12px;padding:2px 9px;border-radius:999px;background:var(--surface);
  border:1px solid var(--line);color:var(--fg-2)}
.parts{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:26px}
.lbl{font-family:var(--mono);font-size:11px;color:var(--fg-3);min-width:96px}
.part{font-family:var(--mono);font-size:11.5px;color:var(--fg-2)}
.part:not(:last-child)::after{content:'/';color:var(--fg-3);margin-left:6px}
h3{font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:.07em;text-transform:uppercase;
  color:var(--fg-3);margin:30px 0 10px}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:9px;background:var(--surface)}
.t{width:100%;border-collapse:collapse;font-size:13.5px}
.t th{text-align:left;font-family:var(--mono);font-weight:400;font-size:10.5px;letter-spacing:.09em;
  text-transform:uppercase;color:var(--fg-3);padding:9px 14px;border-bottom:1px solid var(--line)}
.t td{padding:7px 14px;border-bottom:1px solid color-mix(in srgb,var(--line) 55%,transparent);
  vertical-align:middle;white-space:nowrap}
.t tr:last-child td{border-bottom:none}
.pt{font-family:var(--mono);font-size:12px;color:var(--fg-3)}
.pr,.vn{font-family:var(--mono);font-size:12.5px;color:var(--fg)}
.vn{color:var(--fg-2)}
.vc{font-family:var(--mono);font-size:12.5px;font-variant-numeric:tabular-nums}
.v{color:var(--fg)}
.sw{display:inline-block;width:11px;height:11px;border-radius:3px;background:var(--c);
  border:1px solid color-mix(in srgb,var(--fg) 22%,transparent);margin-right:8px;vertical-align:-1px}
.tc{width:100%}
.tk{font-family:var(--mono);font-size:11.5px;color:var(--accent-dim)}
.tk--none{color:var(--fg-3);font-style:italic}
.tk--suggest{color:var(--warn)}
.tk--gap{color:var(--neg);font-weight:500}
.grp{margin-bottom:14px}
.grp h4{display:flex;align-items:center;gap:9px;font-family:var(--mono);font-weight:500;font-size:12.5px;
  color:var(--fg);margin:0 0 7px}
.cnt{font-size:10.5px;color:var(--fg-3);background:var(--surface);padding:1px 7px;border-radius:999px}
nav .nt:not(:first-child){margin-top:22px}
.kind{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:4px}
.sum{color:var(--fg-2);margin:0 0 14px;max-width:64ch}
.node--code{color:var(--fg-2);border-color:var(--line)}
.stat--draft,.stat--skeleton{color:var(--warn)}
.stat--stable{color:var(--accent)}
.issues{margin:0 0 18px;padding:10px 14px 10px 30px;border:1px solid color-mix(in srgb,var(--warn) 40%,transparent);
  border-radius:9px;color:var(--fg-2);font-size:13.5px;background:color-mix(in srgb,var(--warn) 7%,transparent)}
.issues code,.guide code,.devs code{font-family:var(--mono);font-size:.88em;color:var(--fg)}
.notes{margin:0 0 22px;font-size:13.5px;color:var(--fg-2)}
.notes dt{font-family:var(--mono);font-size:12px;color:var(--fg);margin-top:10px}
.notes dd{margin:2px 0 0;max-width:72ch}
.guide{border-left:2px solid var(--line);padding-left:18px;margin:8px 0 6px;color:var(--fg-2);max-width:72ch}
.guide h3{margin:22px 0 6px}
.guide p,.guide ul{margin:0 0 8px}
.guide ul{padding-left:18px}
.guide b{color:var(--fg);font-weight:600}
.devs{padding-left:18px;color:var(--fg-2);font-size:14px}
.devs .why{display:block;color:var(--fg-3);font-size:13px}
h3 .cnt{margin-left:6px;vertical-align:1px}
a:focus-visible,.node:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:5px}
</style>
<div class="wrap">
  <nav>
    ${nav}
  </nav>
  <main>
    <section class="home" id="home">
      <div class="kind">Design system</div>
      <h1>Rost</h1>
      <p class="lede">My design system, run as its own product. runceanu.com and akount.ing are built on it, and so will whatever I make next.</p>
      <p class="sub"><i>Rost</i> is Romanian. It means purpose, or order: the sense that something is where it belongs. Every component here is a contract, one file that says what the component is, which tokens it uses, how to use it, and where my apps build it. The contracts are the source now. Figma was where it started.</p>
      <div class="links">
        <a href="https://github.com/Runceanu/rost" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://github.com/Runceanu/rost/blob/master/docs/CONTRACT.md" target="_blank" rel="noreferrer">How a contract works</a>
        <a href="https://github.com/Runceanu/rost/blob/master/docs/TOKENS.md" target="_blank" rel="noreferrer">Token coverage</a>
        <a href="https://github.com/Runceanu/rost/blob/master/docs/ROADMAP.md" target="_blank" rel="noreferrer">What's next</a>
      </div>
      <div class="counts">
        <div><b>${contracts.length}</b><span>contracts</span></div>
        <div><b>${built.length}</b><span>built in code</span></div>
        <div><b>${totalVariants}</b><span>variants</span></div>
        <div><b>${totalValues}</b><span>values</span></div>
      </div>
      <h3>In code so far</h3>
      <p class="sub">${built.length ? built.map((e) => `<a href="#${e.id}">${esc(title(e))}</a>`).join(', ') + '. Built from their contracts, and checked pixel by pixel against Figma.' : 'Nothing yet.'} The rest are contracts for now, and they come next, one at a time.</p>
      <h3>Reading this page</h3>
      <p class="sub">Each component starts with how to use it. Then the values: what never changes, then what each variant changes. I keep the token name next to every value on purpose: six tokens here all come out as <code>#3a3a3a</code>, and the colour alone can't tell you which one is right.</p>
    </section>
    ${sections}
  </main>
</div>`)
console.log('reference.html written')

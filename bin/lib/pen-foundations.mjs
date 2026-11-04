// The token pages of design/rost.lib.pen: what Figma shows in its variables
// panel, drawn out so you can see it on the canvas. Every swatch, radius, stroke,
// type sample and opacity is bound to its variable, so the pages change when the
// tokens do. Each page comes back with its size, worked out here from fixed
// widths, so build-pen.mjs can lay the pages out without overlapping.

const MONO = 'JetBrains Mono'
const FONT = '$font-family-base'

export function foundations(tokens, nid) {
  const v = (path) => `$${tokens[path].cssVar.slice(2)}`
  const has = (path) => Boolean(tokens[path])
  const px = (path) => parseFloat(tokens[path].value)
  const short = (p) => p.split('/').slice(1).join('/')

  const text = (content, o = {}) => ({ type: 'text', id: nid(), content, fontFamily: o.font ?? MONO, fontSize: o.size ?? 11, fill: o.fill ?? '$non-interactive-foreground-tertiary', ...(o.weight ? { fontWeight: o.weight } : {}), ...(o.width ? { textGrowth: 'fixed-width', width: o.width } : {}), ...(o.extra ?? {}) })
  const label = (content, width) => text(content, { width, fill: '$non-interactive-foreground-secondary' })

  // A page: the title, a line under it, then its sections. h is worked out by the caller.
  const page = (name, intro, sections, w, h) => ({
    w, h,
    frame: {
      type: 'frame', id: nid(), name, width: w, layout: 'vertical', gap: 40, padding: 64, fill: '$non-interactive-background-primary', theme: { mode: 'dark' }, cornerRadius: 24,
      metadata: { type: 'rost-page', page: name },
      children: [
        { type: 'frame', id: nid(), name: 'Header', layout: 'vertical', gap: 8, children: [
          text(name, { font: FONT, size: 40, weight: '500', fill: '$non-interactive-foreground-primary' }),
          text(intro, { font: FONT, size: 16, fill: '$non-interactive-foreground-tertiary', width: w - 128 }),
        ] },
        ...sections,
      ],
    },
  })
  const HEAD = 40 + 8 + 48 // the title and its intro, about
  const section = (title, children, o = {}) => ({ type: 'frame', id: nid(), name: title, layout: 'vertical', gap: o.gap ?? 12, children: [text(title, { font: FONT, size: 20, weight: '500', fill: '$non-interactive-foreground-primary' }), ...children] })
  const row = (children, gap = 16, extra = {}) => ({ type: 'frame', id: nid(), name: 'Row', layout: 'horizontal', gap, alignItems: 'start', ...extra, children })
  const pages = []

  // ── Colours: the palette, dark and light, one row per hue ──────────────
  {
    const hues = ['neutral', 'primary', 'positive', 'negative', 'warning']
    const sw = (path) => ({ type: 'frame', id: nid(), name: short(path), layout: 'vertical', gap: 6, width: 88, children: [
      { type: 'rectangle', id: nid(), name: 'Swatch', width: 88, height: 56, cornerRadius: 8, fill: v(path), stroke: '$non-interactive-foreground-quinary', strokeWidth: 1 },
      text(path.split('/').pop(), { fill: '$non-interactive-foreground-secondary' }),
      text(tokens[path].value),
    ] })
    const mode = (m) => section(m === 'dark' ? 'Dark' : 'Light', hues.map((hue) => row([
      label(hue, 96),
      ...Object.keys(tokens).filter((k) => k.startsWith(`color/${m}/${hue}/`)).map(sw),
    ], 8)))
    const extra = section('Other', [row(['Base/Black', 'illustration/accent', 'illustration/form', 'illustration/shade'].filter(has).map(sw), 8)])
    const w = 128 + 96 + 8 + 10 * 96
    pages.push(page('Colours', 'The palette. Every other colour in Rost is one of these, picked for the dark theme or the light one. In the Variables panel they are `color-dark-*` and `color-light-*`.', [mode('dark'), mode('light'), extra], w, 128 + HEAD + 3 * 40 + 2 * (32 + 5 * 104 + 4 * 12) + 32 + 104))
  }

  // ── Colour tokens: a name, its dark value and its light value ──────────
  // Semantic first, then each component's own family, in columns.
  const colourRow = (path) => {
    const t = tokens[path]
    const chip = (mode) => ({ type: 'frame', id: nid(), name: mode, theme: { mode }, width: 56, height: 28, cornerRadius: 6, padding: 4, fill: '$non-interactive-background-primary', stroke: '$non-interactive-foreground-quinary', strokeWidth: 1, children: [
      { type: 'rectangle', id: nid(), name: 'Swatch', width: 46, height: 18, cornerRadius: 3, fill: v(path) },
    ] })
    const alias = t.alias ? short(t.alias).replace(/^dark\//, '') : t.value
    return row([label(path, 320), chip('dark'), chip('light'), text(alias, { width: 160 })], 12, { alignItems: 'center', height: 28 })
  }
  const columns = (paths, per) => {
    const cols = []
    for (let i = 0; i < paths.length; i += per) cols.push(paths.slice(i, i + per))
    return cols
  }
  const COLW = 320 + 56 + 56 + 160 + 36
  const colourPage = (name, intro, groups, per) => {
    // Each group is a titled list; long groups break into columns of `per` rows.
    const blocks = groups.flatMap(([title, paths]) => columns(paths, per).map((c, i) => ({ title: i ? `${title} (cont.)` : title, paths: c })))
    const perRow = 4
    const lines = []
    for (let i = 0; i < blocks.length; i += perRow) lines.push(blocks.slice(i, i + perRow))
    const sections = lines.map((line) => row(line.map((b) => ({ type: 'frame', id: nid(), name: b.title, layout: 'vertical', gap: 8, width: COLW, children: [
      text(b.title, { font: FONT, size: 20, weight: '500', fill: '$non-interactive-foreground-primary' }),
      row([text('token', { width: 320 }), text('dark', { width: 56 }), text('light', { width: 56 }), text('alias', { width: 160 })], 12),
      ...b.paths.map(colourRow),
    ] })), 48))
    const h = 128 + HEAD + lines.reduce((s, line) => s + 40 + 28 + 22 + Math.max(...line.map((b) => b.paths.length)) * 36, 0)
    pages.push(page(name, intro, sections, 128 + perRow * COLW + (perRow - 1) * 48, h))
  }
  const isColour = (k) => /^#|^rgb/.test(String(tokens[k].value))
  const fam = (prefix) => Object.keys(tokens).filter((k) => k.split('/')[0] === prefix && isColour(k))
  colourPage('Semantic colours', 'What things mean, not what colour they are: a background, a label, an outline. Each one points at a palette colour, a different one in each theme. The alias column says which, in the dark theme.', [
    ['Non-interactive', fam('non-interactive')],
    ['Interactive', fam('interactive')],
    ['Shared', ['background', 'label', 'sub-label', 'icon', 'outline', 'focus-ring'].filter(has)],
  ], 40)
  const SEMANTIC = new Set(['color', 'non-interactive', 'interactive', 'background', 'label', 'sub-label', 'icon', 'outline', 'focus-ring', 'Base', 'illustration'])
  const families = [...new Set(Object.keys(tokens).filter(isColour).map((k) => k.split('/')[0]))].filter((f) => !SEMANTIC.has(f))
  colourPage('Component colours', 'Each interactive component has its own family, so one component can change without moving the rest. They all start as aliases of the semantic colours.', families.map((f) => [f, fam(f)]), 48)

  // ── Typography ─────────────────────────────────────────────────────────
  {
    const styles = ['display', 'headline', 'sub-headline', 'title', 'sub-title', 'subtitle', 'paragraph', 'body', 'label', 'placeholder'].filter((s) => has(`typography/${s}/font-size`))
    const W = 1440
    let h = 128 + HEAD + 40 + 32
    const rows = styles.map((s) => {
      const p = (k) => `typography/${s}/${k}`
      const size = px(p('font-size')), lh = has(p('line-height')) ? px(p('line-height')) : null
      const weight = has(p('font-weight/regular')) ? v(p('font-weight/regular')) : '400'
      const weights = ['regular', 'medium', 'semibold'].filter((w) => has(p(`font-weight/${w}`))).map((w) => tokens[p(`font-weight/${w}`)].value)
      h += Math.max(lh ?? size * 1.3, 40) + 24
      return row([
        { type: 'frame', id: nid(), name: 'Spec', layout: 'vertical', gap: 4, width: 220, children: [
          label(s, 220),
          text(`${size} / ${lh ?? '-'} · ${weights.join(' ')}`, { width: 220 }),
        ] },
        text('Things where they belong', { font: FONT, width: W - 128 - 220 - 32, fill: '$non-interactive-foreground-primary', extra: { fontSize: v(p('font-size')), fontWeight: weight, ...(has(p('letter-spacing')) ? { letterSpacing: v(p('letter-spacing')) } : {}), ...(lh ? { lineHeight: Math.round((lh / size) * 1000) / 1000 } : {}) } }),
      ], 32, { alignItems: 'center' })
    })
    const sizes = Object.keys(tokens).filter((k) => /^typography\/font-size\/\d+$/.test(k))
    const scale = row(sizes.map((k) => ({ type: 'frame', id: nid(), name: k.split('/').pop(), layout: 'vertical', gap: 6, alignItems: 'start', children: [
      text('Aa', { font: FONT, fill: '$non-interactive-foreground-primary', extra: { fontSize: v(k), lineHeight: 1 } }),
      text(k.split('/').pop()),
    ] })), 24, { alignItems: 'end' })
    const weights = row(Object.keys(tokens).filter((k) => /^typography\/font-weight\/[a-z]+$/.test(k)).map((k) => ({ type: 'frame', id: nid(), name: k.split('/').pop(), layout: 'vertical', gap: 6, children: [
      text('Aa', { font: FONT, size: 40, fill: '$non-interactive-foreground-primary', extra: { fontWeight: v(k) } }),
      text(`${k.split('/').pop()} ${tokens[k].value}`),
    ] })), 40)
    h += 40 + 32 + 88 + 40 + 40 + 32 + 80
    pages.push(page('Typography', 'One family, General Sans. pen.dev only draws Google fonts, so it shows a stand-in here; the variable still says General Sans. Line heights are a ratio in pen.dev, so they are written out, not bound.', [
      section('Styles', rows, { gap: 24 }),
      section('Sizes', [scale]),
      section('Weights', [weights]),
    ], W, h))
  }

  // ── Spacing, size, radius, outline ─────────────────────────────────────
  {
    const scaleRow = (k) => row([label(short(k), 200), text(tokens[k].value, { width: 64 }), { type: 'rectangle', id: nid(), name: 'Bar', width: Math.max(1, Math.min(px(k), 960)), height: 12, cornerRadius: 2, fill: '$non-interactive-background-brand', context: k }], 16, { alignItems: 'center', height: 20 })
    const list = (re) => Object.keys(tokens).filter((k) => re.test(k)).sort((a, b) => px(a) - px(b))
    const gaps = list(/^spacing\/gap\//), base = list(/^spacing\/base-/), sizes = list(/^spacing\/size\//)
    const sizeBox = (k) => ({ type: 'frame', id: nid(), name: short(k), layout: 'vertical', gap: 8, children: [
      { type: 'rectangle', id: nid(), name: 'Box', width: Math.max(px(k), 1), height: Math.max(px(k), 1), cornerRadius: 4, fill: '$non-interactive-background-tertiary', context: k },
      text(k.split('/').pop(), { fill: '$non-interactive-foreground-secondary' }), text(tokens[k].value),
    ] })
    const W = 1440
    const h = 128 + HEAD + 2 * 40 + (32 + Math.max(gaps.length, base.length) * 28) + (32 + 120)
    // Base and gap side by side: the gaps are named steps of the base.
    pages.push(page('Spacing', 'Gaps and paddings come from one base step of 2px. The named gaps are aliases of it, and they are what the components use. pen.dev drops a variable on a width, so the bars and boxes have numbers; the token is in each one\'s context.', [
      row([section('Gap', gaps.map(scaleRow), { gap: 8 }), section('Base', base.map(scaleRow), { gap: 8 })], 80),
      section('Size', [row(sizes.map(sizeBox), 24, { alignItems: 'end' })]),
    ], W, h))
    const radii = list(/^spacing\/radius\//), outlines = list(/^spacing\/outline\//)
    const tile = (k, o) => ({ type: 'frame', id: nid(), name: short(k), layout: 'vertical', gap: 8, children: [
      { type: 'rectangle', id: nid(), name: 'Tile', width: 96, height: 96, fill: '$non-interactive-background-secondary', ...o },
      text(k.split('/').pop(), { fill: '$non-interactive-foreground-secondary' }), text(tokens[k].value),
    ] })
    pages.push(page('Radius and outline', 'Corner radii and stroke widths. Both bind in pen.dev, so these tiles move with the tokens.', [
      section('Radius', [row(radii.map((k) => tile(k, { cornerRadius: v(k), stroke: '$non-interactive-foreground-quadruple', strokeWidth: 1 })), 24)]),
      section('Outline', [row(outlines.map((k) => tile(k, { cornerRadius: 12, stroke: '$non-interactive-foreground-secondary', strokeWidth: v(k), strokeAlignment: 'inner' })), 24)]),
    ], 128 + Math.max(radii.length, outlines.length) * 120, 128 + HEAD + 2 * 40 + 2 * (32 + 140)))
  }

  // ── Opacity, effects, motion ───────────────────────────────────────────
  {
    const ops = Object.keys(tokens).filter((k) => k.startsWith('opacity/')).sort((a, b) => px(a) - px(b))
    const op = (k) => ({ type: 'frame', id: nid(), name: short(k), layout: 'vertical', gap: 8, children: [
      { type: 'frame', id: nid(), name: 'Plate', width: 96, height: 96, cornerRadius: 12, fill: '$non-interactive-background-secondary', layout: 'none', children: [
        { type: 'rectangle', id: nid(), name: 'Tint', x: 0, y: 0, width: 96, height: 96, cornerRadius: 12, fill: '$non-interactive-foreground-primary', opacity: v(k) },
      ] },
      text(k.split('/').pop(), { fill: '$non-interactive-foreground-secondary' }), text(tokens[k].value),
    ] })
    // A striped plate, so a blur has something to blur.
    const stripes = (w, hgt) => Array.from({ length: 8 }, (_, i) => ({ type: 'rectangle', id: nid(), name: 'Stripe', x: i * 24, y: 0, width: 12, height: hgt, fill: i % 2 ? '$non-interactive-background-brand' : '$non-interactive-foreground-tertiary' }))
    const blurs = Object.keys(tokens).filter((k) => k.startsWith('effect/')).map((k) => {
      const r = parseFloat(String(tokens[k].value).match(/blur\(([\d.]+)px\)/)?.[1] ?? 0)
      return { type: 'frame', id: nid(), name: short(k), layout: 'vertical', gap: 8, children: [
        { type: 'frame', id: nid(), name: 'Plate', width: 192, height: 112, cornerRadius: 12, clip: true, fill: '$non-interactive-background-secondary', layout: 'none', children: [
          ...stripes(192, 112),
          { type: 'rectangle', id: nid(), name: 'Glass', x: 32, y: 24, width: 128, height: 64, cornerRadius: 10, fill: '#17171766', effect: { type: 'background_blur', radius: r }, context: k },
        ] },
        text(short(k), { fill: '$non-interactive-foreground-secondary' }), text(tokens[k].value),
      ] }
    })
    const shadow = has('shadow/floating') ? [{ type: 'frame', id: nid(), name: 'floating', layout: 'vertical', gap: 8, padding: [0, 0, 24, 0], children: [
      { type: 'rectangle', id: nid(), name: 'Card', width: 192, height: 112, cornerRadius: 12, fill: '$non-interactive-background-tertiary', effect: { type: 'shadow', shadowType: 'outer', offset: { x: 0, y: 16 }, blur: 24, color: '#00000029' }, context: 'shadow/floating' },
      text('shadow/floating', { fill: '$non-interactive-foreground-secondary' }), text(tokens['shadow/floating'].value),
    ] }] : []
    const motion = Object.keys(tokens).filter((k) => k.startsWith('motion/')).map((k) => row([label(short(k), 200), text(tokens[k].value, { width: 320 })], 16, { height: 18 }))
    pages.push(page('Opacity, effects and motion', 'Opacity is a percentage in pen.dev, so `opacity-gentle` is 24 where the code has 0.24. It draws the same. Blurs and the shadow are written out; motion is here as a list, since pen.dev doesn\'t animate.', [
      section('Opacity', [row(ops.map(op), 16)]),
      section('Effects', [row([...blurs, ...shadow], 24)]),
      section('Motion', motion, { gap: 6 }),
    ], 128 + Math.max(ops.length * 112, 5 * 216), 128 + HEAD + 3 * 40 + (32 + 140) + (32 + 160) + (32 + motion.length * 24)))
  }
  return pages
}

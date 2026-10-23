/**
 * The Paper effect: a disc of dots on the 16px grid, behind a hero. It never
 * moves by itself. It only reacts: the cursor is a magnifier (dots grow and
 * spread under an eased lens), pressing presses deeper into the paper, and
 * hovering one of the hero's buttons raises a lens under it.
 * With `sketches`, a kit component is drawn on the paper from time to time,
 * the way runceanu.com does it: the pen runs along the dot rows, holds, then
 * fades, and the ink bulges under the lens like the dots. runceanu.com's
 * ripple with its availability dot stays there.
 * Built from contracts/effect-paper.contract.yaml.
 *
 *   const stop = mountPaper(canvas, { area: hero, buttons: hero.querySelectorAll('.rost-button'), sketches: true })
 *
 * The canvas is decoration: give it aria-hidden="true" and pointer-events: none.
 */

export interface PaperOptions {
  /** The element the disc centres on, and whose buttons raise a lens. Default: the canvas's parent. */
  readonly area?: Element | null
  /** Buttons that raise a lens under them on hover. */
  readonly buttons?: Iterable<Element>
  /** Draw a kit component on the paper from time to time. Off with reduced motion. */
  readonly sketches?: boolean
}

// Tuned by eye on runceanu.com, and only the paper uses them (see the contract).
const LENS_R = 210 // reach of the cursor lens
const PUSH = 9 // how far dots move outward at the crest
const MAG = 1.3 // extra dot radius at the crest: 1px grows to 2.3px
const DOT_R = 1
const HALO = { r: 240, gain: 1.3 }
const PRESS = { r: 330, gain: 1.7 }
// Sketches: one component's whole life (draw, hold, fade), the share of it
// spent drawing, and the pause before the next. runceanu.com takes 5.2s and
// waits 7 to 8; here they come sooner and draw quicker.
const SKETCH = { life: 3200, draw: 0.32, first: 500, gap: [2000, 3000] as const }

type Pt = [number, number]
const seg = (pts: Pt[], x1: number, y1: number, x2: number, y2: number, step = 5) => {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step))
  for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n])
}
const arc = (pts: Pt[], cx: number, cy: number, r: number, a0: number, a1: number, step = 5) => {
  const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / step))
  for (let i = pts.length ? 1 : 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) }
}
const rrect = (x: number, y: number, w: number, h: number, r: number): Pt[] => {
  const pts: Pt[] = [[x + r, y]]
  seg(pts, x + r, y, x + w - r, y); arc(pts, x + w - r, y + r, r, -Math.PI / 2, 0)
  seg(pts, x + w, y + r, x + w, y + h - r); arc(pts, x + w - r, y + h - r, r, 0, Math.PI / 2)
  seg(pts, x + w - r, y + h, x + r, y + h); arc(pts, x + r, y + h - r, r, Math.PI / 2, Math.PI)
  seg(pts, x, y + h - r, x, y + r); arc(pts, x + r, y + r, r, Math.PI, Math.PI * 1.5)
  return pts
}
const circle = (cx: number, cy: number, r: number): Pt[] => { const pts: Pt[] = []; arc(pts, cx, cy, r, -Math.PI / 2, Math.PI * 1.5); return pts }
const line = (x1: number, y1: number, x2: number, y2: number): Pt[] => { const pts: Pt[] = [[x1, y1]]; seg(pts, x1, y1, x2, y2); return pts }
// Kit components in grid cells: the outlines run along dot rows and columns,
// the small parts inside keep their natural proportions.
const SHAPES: { w: number; h: number; build: (g: number) => Pt[][] }[] = [
  { w: 10, h: 4, build: (g) => [rrect(0, 0, 10 * g, 4 * g, 2 * g), rrect(g, g, 2 * g, 2 * g, 0.5 * g), rrect(4 * g, 1.5 * g, 4 * g, g, 0.5 * g)] }, // badge
  { w: 10, h: 4, build: (g) => [rrect(0, 0, 10 * g, 4 * g, 2 * g), circle(2 * g, 2 * g, g), rrect(3.5 * g, 1.5 * g, 3 * g, g, 0.5 * g), line(7.55 * g, 1.55 * g, 8.45 * g, 2.45 * g), line(8.45 * g, 1.55 * g, 7.55 * g, 2.45 * g)] }, // chip
  { w: 4, h: 4, build: (g) => [circle(2 * g, 2 * g, 2 * g), line(1.2 * g, 2 * g, 2.8 * g, 2 * g), line(2 * g, 1.2 * g, 2 * g, 2.8 * g)] }, // icon button
  { w: 4, h: 2, build: (g) => [rrect(0, 0, 4 * g, 2 * g, g), circle(g, g, 0.62 * g)] }, // toggle
  { w: 3, h: 3, build: (g) => [rrect(0, 0, 3 * g, 3 * g, 0.75 * g), line(0.8 * g, 1.6 * g, 1.35 * g, 2.15 * g), line(1.35 * g, 2.15 * g, 2.3 * g, 0.95 * g)] }, // checkbox
  { w: 4, h: 4, build: (g) => [circle(2 * g, 2 * g, 2 * g), circle(2 * g, 2 * g, 0.9 * g)] }, // radio
  { w: 7, h: 4, build: (g) => [rrect(0, 0, 7 * g, 4 * g, 2 * g), rrect(1.5 * g, 1.5 * g, 3 * g, g, 0.5 * g)] }, // tag
  { w: 12, h: 4, build: (g) => [rrect(0, 0, 12 * g, 4 * g, g), rrect(g, 1.5 * g, 4 * g, g, 0.5 * g), line(6.5 * g, g, 6.5 * g, 3 * g)] }, // input
]

/** `#ededed` or `rgb(…)` from a token, as [r, g, b]. */
function rgb(value: string, fallback: [number, number, number]): [number, number, number] {
  const v = value.trim()
  const hex = v.match(/^#([0-9a-f]{6})/i)?.[1]
  if (hex) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  const m = v.match(/(\d+)\D+(\d+)\D+(\d+)/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback
}

export function mountPaper(canvas: HTMLCanvasElement, options: PaperOptions = {}): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const area = options.area ?? canvas.parentElement
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const css = getComputedStyle(document.documentElement)
  const token = (name: string) => css.getPropertyValue(name)
  const GAP = parseFloat(token('--spacing-gap-medium')) || 16
  const BASE_A = parseFloat(token('--opacity-soft')) || 0.16
  const INK = rgb(token('--non-interactive-foreground-primary'), [237, 237, 237])
  const ACCENT = rgb(token('--actions-primary-default-background'), [0, 214, 105])
  const PEN = rgb(token('--non-interactive-foreground-secondary'), [211, 217, 213])
  const PEN_A = parseFloat(token('--opacity-mild')) || 0.32
  const PEN_W = parseFloat(token('--spacing-outline-medium')) || 2

  let w = 0, h = 0, dpr = 1, raf = 0
  // Lens sources, all eased toward their targets.
  const cur = { x: -9999, y: -9999, p: 0 }
  const target = { x: -9999, y: -9999, p: 0 }
  const halo = { x: 0, y: 0, p: 0, tp: 0 }
  const press = { x: 0, y: 0, p: 0, tp: 0 }
  // The sketch being drawn: its polylines with their running lengths.
  let sketch: { t0: number; total: number; polys: { pts: Pt[]; len: number; start: number }[] } | null = null
  let last = -1
  let nextAt = performance.now() + SKETCH.first

  function resize() {
    const r = canvas.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = r.width
    h = r.height
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    draw()
  }

  /** The strongest lens at a point: [strength, direction x, direction y]. */
  function field(x: number, y: number): [number, number, number] {
    let e = 0, fx = 0, fy = 0
    const dome = (cx: number, cy: number, R: number, p: number) => {
      if (p <= 0.001) return
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy)
      if (d >= R) return
      const t = (1 - d / R) * p
      const s = t * t * (3 - 2 * t)
      if (s > e) { e = s; fx = dx / (d || 1); fy = dy / (d || 1) }
    }
    dome(cur.x, cur.y, LENS_R, cur.p)
    dome(halo.x, halo.y, HALO.r, halo.p * HALO.gain)
    dome(press.x, press.y, PRESS.r, press.p * PRESS.gain)
    return [Math.min(e, 1.7), fx, fy]
  }

  function draw(now = performance.now()) {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx!.clearRect(0, 0, w, h)
    const x0 = (w % GAP) / 2 || 0
    const y0 = GAP / 2
    const active = cur.p > 0.001 || halo.p > 0.001 || press.p > 0.001
    for (let y = y0; y <= h; y += GAP) {
      for (let x = x0; x <= w; x += GAP) {
        let dx = 0, dy = 0, r = DOT_R, g = 0
        if (active) {
          const [e, fx, fy] = field(x, y)
          if (e > 0.001) {
            r = DOT_R * (1 + MAG * e)
            dx = fx * PUSH * e
            dy = fy * PUSH * e
            // At the very crest the dots warm toward the accent.
            g = Math.min(0.6, Math.max(0, (e - 0.78) / 0.22) * 0.5)
          }
        }
        const c = INK.map((v, i) => Math.round(v + (ACCENT[i]! - v) * g))
        ctx!.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${BASE_A})`
        ctx!.beginPath()
        ctx!.arc(x + dx, y + dy, r, 0, 7)
        ctx!.fill()
      }
    }
    if (sketch) drawSketch(now)
  }

  function startSketch() {
    let i = Math.floor(Math.random() * SHAPES.length)
    if (i === last) i = (i + 1) % SHAPES.length
    last = i
    const S = SHAPES[i]!
    // Near the middle, where the dots are solid even when the paper is faded
    // into a disc, snapped onto the dots.
    const x0 = (w % GAP) / 2 || 0, y0 = GAP / 2
    const room = Math.min(w, h) * 0.4
    const tx = w / 2 + (Math.random() - 0.5) * Math.max(0, room - S.w * GAP) - (S.w * GAP) / 2
    const ty = h / 2 + (Math.random() - 0.5) * Math.max(0, room - S.h * GAP) - (S.h * GAP) / 2
    const X = x0 + Math.round((tx - x0) / GAP) * GAP, Y = y0 + Math.round((ty - y0) / GAP) * GAP
    let total = 0
    const polys = S.build(GAP).map((raw) => {
      const pts = raw.map(([px, py]) => [px + X, py + Y] as Pt)
      let len = 0
      for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1])
      const start = total
      total += len
      return { pts, len, start }
    })
    sketch = { t0: performance.now(), total, polys }
    wake()
  }

  // The pen draws the strokes in order, holds, then fades. Every point rides
  // the lens, so the ink bulges under the cursor like the paper.
  function drawSketch(now: number) {
    const u = (now - sketch!.t0) / SKETCH.life
    if (u >= 1) { sketch = null; nextAt = now + SKETCH.gap[0] + Math.random() * (SKETCH.gap[1] - SKETCH.gap[0]); return }
    const d = Math.min(1, u / SKETCH.draw)
    const budget = sketch!.total * d * d * (3 - 2 * d)
    const fade = 1 - Math.max(0, (u - 0.8) / 0.2)
    const warp = (x: number, y: number): Pt => { const [e, fx, fy] = field(x, y); return [x + fx * PUSH * e, y + fy * PUSH * e] }
    ctx!.save()
    ctx!.strokeStyle = `rgba(${PEN[0]},${PEN[1]},${PEN[2]},${PEN_A * fade})`
    ctx!.lineWidth = PEN_W
    ctx!.lineCap = 'round'
    ctx!.lineJoin = 'round'
    for (const P of sketch!.polys) {
      if (budget <= P.start) break
      const avail = Math.min(P.len, budget - P.start)
      ctx!.beginPath()
      let acc = 0
      for (let k = 0; k < P.pts.length; k++) {
        if (k > 0) {
          const [ax, ay] = P.pts[k - 1]!, [bx, by] = P.pts[k]!
          const sl = Math.hypot(bx - ax, by - ay)
          if (acc + sl > avail) { const t = (avail - acc) / sl; ctx!.lineTo(...warp(ax + (bx - ax) * t, ay + (by - ay) * t)); break }
          acc += sl
        }
        const [wx, wy] = warp(P.pts[k]![0], P.pts[k]![1])
        if (k === 0) ctx!.moveTo(wx, wy)
        else ctx!.lineTo(wx, wy)
      }
      ctx!.stroke()
    }
    ctx!.restore()
  }

  function tick(now: number) {
    raf = 0
    cur.x += (target.x - cur.x) * 0.18
    cur.y += (target.y - cur.y) * 0.18
    cur.p += (target.p - cur.p) * 0.12
    halo.p += (halo.tp - halo.p) * 0.14
    press.p += (press.tp - press.p) * (press.tp > press.p ? 0.3 : 0.08)
    draw(now)
    const settled = Math.abs(target.x - cur.x) < 0.3 && Math.abs(target.y - cur.y) < 0.3
      && Math.abs(target.p - cur.p) < 0.004 && Math.abs(halo.tp - halo.p) < 0.004 && Math.abs(press.tp - press.p) < 0.004
      && !sketch
    if (!settled || target.p > 0 || halo.tp > 0 || press.tp > 0) raf = requestAnimationFrame(tick)
    else draw(now) // a clean frame once the last sketch has faded
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick) }

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, r }
  }
  function onMove(e: PointerEvent) {
    const { x, y, r } = local(e)
    if (x < -40 || x > r.width + 40 || y < -40 || y > r.height + 40) {
      if (target.p !== 0) { target.p = 0; wake() }
      return
    }
    target.x = x
    target.y = y
    if (target.p === 0) { cur.x = x; cur.y = y }
    target.p = 1
    wake()
  }
  const onLeave = () => { target.p = 0; wake() }
  function onDown(e: PointerEvent) {
    const { x, y, r } = local(e)
    if (x < 0 || x > r.width || y < 0 || y > r.height) return
    press.x = x
    press.y = y
    press.tp = 1
    wake()
  }
  const onUp = () => { press.tp = 0; wake() }
  const buttons = [...(options.buttons ?? [])]
  const onEnter = (ev: Event) => {
    const r = canvas.getBoundingClientRect()
    const b = (ev.currentTarget as Element).getBoundingClientRect()
    halo.x = b.left + b.width / 2 - r.left
    halo.y = b.top + b.height / 2 - r.top
    halo.tp = 1
    wake()
  }
  const onExit = () => { halo.tp = 0; wake() }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  if (area) ro.observe(area)
  resize()
  // Sketches only while the paper is on screen, and never with reduced motion.
  let visible = true
  const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting })
  io.observe(canvas)
  const timer = options.sketches && !reduce
    ? window.setInterval(() => { if (!sketch && visible && w > 0 && performance.now() >= nextAt) startSketch() }, 200)
    : 0
  // Reduced motion: the paper stays still and flat.
  if (!reduce) {
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave, { passive: true })
    for (const b of buttons) { b.addEventListener('pointerenter', onEnter); b.addEventListener('pointerleave', onExit) }
  }
  return () => {
    ro.disconnect()
    io.disconnect()
    if (timer) clearInterval(timer)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    for (const b of buttons) { b.removeEventListener('pointerenter', onEnter); b.removeEventListener('pointerleave', onExit) }
    if (raf) cancelAnimationFrame(raf)
  }
}

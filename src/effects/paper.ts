/**
 * The Paper effect: a disc of dots on the 16px grid, behind a hero. It never
 * moves by itself. It only reacts: the cursor is a magnifier (dots grow and
 * spread under an eased lens), pressing presses deeper into the paper, and
 * hovering one of the hero's buttons raises a lens under it.
 * Built from contracts/effect-paper.contract.yaml. runceanu.com's version
 * also sketches components on the paper and ripples with its availability
 * dot; Rost's doesn't do either.
 *
 *   const stop = mountPaper(canvas, { area: hero, buttons: hero.querySelectorAll('.rost-button') })
 *
 * The canvas is decoration: give it aria-hidden="true" and pointer-events: none.
 */

export interface PaperOptions {
  /** The element the disc centres on, and whose buttons raise a lens. Default: the canvas's parent. */
  readonly area?: Element | null
  /** Buttons that raise a lens under them on hover. */
  readonly buttons?: Iterable<Element>
}

// Tuned by eye on runceanu.com, and only the paper uses them (see the contract).
const LENS_R = 210 // reach of the cursor lens
const PUSH = 9 // how far dots move outward at the crest
const MAG = 1.3 // extra dot radius at the crest: 1px grows to 2.3px
const DOT_R = 1
const HALO = { r: 240, gain: 1.3 }
const PRESS = { r: 330, gain: 1.7 }

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

  let w = 0, h = 0, dpr = 1, raf = 0
  // Lens sources, all eased toward their targets.
  const cur = { x: -9999, y: -9999, p: 0 }
  const target = { x: -9999, y: -9999, p: 0 }
  const halo = { x: 0, y: 0, p: 0, tp: 0 }
  const press = { x: 0, y: 0, p: 0, tp: 0 }

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

  function draw() {
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
  }

  function tick() {
    raf = 0
    cur.x += (target.x - cur.x) * 0.18
    cur.y += (target.y - cur.y) * 0.18
    cur.p += (target.p - cur.p) * 0.12
    halo.p += (halo.tp - halo.p) * 0.14
    press.p += (press.tp - press.p) * (press.tp > press.p ? 0.3 : 0.08)
    draw()
    const settled = Math.abs(target.x - cur.x) < 0.3 && Math.abs(target.y - cur.y) < 0.3
      && Math.abs(target.p - cur.p) < 0.004 && Math.abs(halo.tp - halo.p) < 0.004 && Math.abs(press.tp - press.p) < 0.004
    if (!settled || target.p > 0 || halo.tp > 0 || press.tp > 0) raf = requestAnimationFrame(tick)
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
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    for (const b of buttons) { b.removeEventListener('pointerenter', onEnter); b.removeEventListener('pointerleave', onExit) }
    if (raf) cancelAnimationFrame(raf)
  }
}

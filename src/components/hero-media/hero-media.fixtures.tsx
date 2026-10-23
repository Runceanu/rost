import { HeroMedia } from './HeroMedia'

/**
 * Figma's Hero Media (portfolio file, 793:2345) has both slots empty, so the
 * test compares the frame: the 16px border, the 24px corners and the two
 * surfaces. The artwork is each case study's own.
 */
export const fixtures = [
  { node: '793:2345', name: 'hero-media', element: <div style={{ width: 1440 }}><HeroMedia /></div> },
]

// Neutral artwork: hills in flat colour, nobody's work.
const hills = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="#2f4a5c"/><circle cx="860" cy="190" r="90" fill="#f2d7a0"/><path d="M0 380 Q300 250 600 340 T1200 300 V600 H0Z" fill="#3e6b5a"/><path d="M0 470 Q420 360 760 450 T1200 430 V600 H0Z" fill="#1f3b2f"/></svg>')}`

/** What a caller writes. Shown on the component's page. */
export const usage = `import { HeroMedia } from 'rost/components/hero-media/HeroMedia'

<HeroMedia media={<div className="hero-art" />}>
  <h1>Creator first finance</h1>
</HeroMedia>

/* The artwork pins itself, at its own size in px: */
.hero-art { position: absolute; inset: 0; background: url(/art/hero.webp) no-repeat -236px -832px / 2568px 2608px fixed; }
@media (pointer: coarse), (prefers-reduced-motion: reduce) { .hero-art { background-attachment: scroll; } }`

/** What the component's card and page on rost.build show. */
export const preview = (
  <span style={{ display: 'block', width: 360 }}>
    <HeroMedia style={{ height: 200 }} media={<span style={{ position: 'absolute', inset: 0, background: `url("${hills}") center / cover` }} />}>
      <span style={{ display: 'flex', alignItems: 'flex-end', height: '100%', padding: 16, fontSize: 18, fontWeight: 600 }}>Case study title</span>
    </HeroMedia>
  </span>
)

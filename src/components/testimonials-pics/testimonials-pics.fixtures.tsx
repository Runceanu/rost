import { TestimonialPicture } from './TestimonialPicture'

/**
 * Figma's TestimonialPicture is a 56px square with an empty image slot, so
 * the test compares an empty one. The pictures on the site are neutral: a few
 * landscapes in flat colour, no one in them.
 */
const scene = (sky: string, sun: string, far: string, near: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="${sky}"/><circle cx="38" cy="20" r="8" fill="${sun}"/><path d="M0 38 Q14 26 28 34 T56 30 V56 H0Z" fill="${far}"/><path d="M0 46 Q20 36 36 44 T56 42 V56 H0Z" fill="${near}"/></svg>`)}`

export const samples = [
  scene('#2f4a5c', '#f2d7a0', '#3e6b5a', '#1f3b2f'),
  scene('#5c3f4a', '#f6c48b', '#7a5560', '#3b2a31'),
  scene('#38404a', '#d9e2e8', '#59636e', '#262c33'),
  scene('#4a5c2f', '#f0e6b0', '#6b7a3e', '#2f3b1f'),
]

export const fixtures = [
  // The test compares the empty slot; the page shows it with a picture in.
  { node: '438:72', name: 'testimonials-pics', element: <TestimonialPicture />, display: <TestimonialPicture src={samples[0]} alt="" /> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { TestimonialPicture } from 'rost/components/testimonials-pics/TestimonialPicture'

<TestimonialPicture src="/people/client-1.jpg" alt="" />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 12 }}>
    {samples.slice(0, 3).map((s) => <TestimonialPicture key={s} src={s} style={{ borderRadius: '50%' }} />)}
  </span>
)

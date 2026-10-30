// Paper is drawn on a canvas by src/effects/paper.ts, so its preview is a
// canvas the page mounts it on (data-paper-preview). Move the pointer over it.
export const fixtures = []

/** What a caller writes. */
export const usage = `import { mountPaper } from 'rost/effects/paper'

const stop = mountPaper(canvas, { area: hero, buttons: hero.querySelectorAll('.rost-button'), sketches: true })`

/** What the effect's card and page on rost.build show: the sheet itself, live. */
export const preview = (
  <span style={{ position: 'relative', display: 'block', width: 280, height: 160 }}>
    <canvas data-paper-preview aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  </span>
)

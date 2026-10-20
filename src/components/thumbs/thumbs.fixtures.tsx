import { Thumbs } from './Thumbs'

/**
 * One fixture per Figma variant. Hover, pressed and focus are the browser's
 * own states, so the visual test forces them (`force`) instead of a prop.
 *
 * Figma's sample shows a real client's name, and that screenshot stays on my
 * machine. Here the name is Figma's own default, "Client", and the test leaves
 * the name's box out of the comparison (`mask`), in Figma's coordinates.
 */
const SIZE = { width: 384, height: 334 }
const NAME = { x: 56, y: 249, width: 200, height: 34 }

export const fixtures = [
  { node: '109:78', name: 'state=Default', element: <Thumbs href="#" style={SIZE} />, mask: [NAME] },
  { node: '109:77', name: 'state=Hover', element: <Thumbs href="#" style={SIZE} />, force: ['hover'], mask: [NAME] },
  { node: '109:168', name: 'state=Pressed', element: <Thumbs href="#" style={SIZE} />, force: ['active'], mask: [NAME] },
  // The ring sits 4px outside the card, and Figma's frame includes it.
  { node: '109:118', name: 'state=Focus', element: <div style={{ padding: 4, display: 'inline-block' }}><Thumbs href="#" style={SIZE} /></div>, force: ['focus', 'focus-visible'], mask: [{ ...NAME, x: NAME.x + 4, y: NAME.y + 4 }] },
  { node: '109:206', name: 'state=Disabled', element: <Thumbs disabled style={SIZE} />, mask: [NAME] },
  { node: '261:1232', name: 'state=Locked', element: <Thumbs href="#" locked style={SIZE} />, mask: [NAME] },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Thumbs } from 'rost/components/thumbs/Thumbs'

<Thumbs href="/work/akount" number="01" name="akount.ing" industry="Finance" type="Product" period="2025">
  <img src="/work/akount.jpg" alt="" />
</Thumbs>

<Thumbs disabled number="02" name="Next one" industry="Health" type="Platform" period="2026" />`

/** What the component's card on rost.build shows: a smaller Thumbs, without its own link. */
export const preview = (
  <span style={{ display: 'block', width: 384 * 0.36, height: 334 * 0.36 }}>
    <span style={{ display: 'block', transform: 'scale(.36)', transformOrigin: 'top left' }}>
      <Thumbs as="div" number="01" name="Rost" showIndustry={false} showType={false} showPeriod={false} style={{ width: 384, height: 334 }}>
        <span style={{ position: 'absolute', inset: 0, background: 'var(--non-interactive-background-primary)' }} />
      </Thumbs>
    </span>
  </span>
)

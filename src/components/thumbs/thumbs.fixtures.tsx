import { InlineBanner } from '../inline-banner/InlineBanner'
import { Thumbs } from './Thumbs'

/**
 * One fixture per Figma variant. Hover, pressed and focus are the browser's
 * own states, so the visual test forces them (`force`) instead of a prop.
 * The name is Figma's sample, "Client".
 */
const SIZE = { width: 384, height: 334 }

export const fixtures = [
  { node: '109:78', name: 'state=Default', element: <Thumbs href="#" name="Client" style={SIZE} /> },
  { node: '109:77', name: 'state=Hover', element: <Thumbs href="#" name="Client" style={SIZE} />, force: ['hover'] },
  { node: '109:168', name: 'state=Pressed', element: <Thumbs href="#" name="Client" style={SIZE} />, force: ['active'] },
  // The ring sits 4px outside the card, and Figma's frame includes it.
  { node: '109:118', name: 'state=Focus', element: <div style={{ padding: 'var(--spacing-gap-2xsmall)', display: 'inline-block' }}><Thumbs href="#" name="Client" style={SIZE} /></div>, force: ['focus', 'focus-visible'] },
  { node: '109:206', name: 'state=Disabled', element: <Thumbs disabled name="Client" style={SIZE} /> },
  { node: '261:1232', name: 'state=Locked', element: <Thumbs href="#" name="Client" locked style={SIZE} /> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Thumbs } from 'rost/components/thumbs/Thumbs'

<Thumbs href="/work/akount" number="01" name="akount.ing" industry="Finance" kind="Product" period="2025">
  <img src="/work/akount.jpg" alt="" />
</Thumbs>

<Thumbs disabled number="02" name="Next one" industry="Health" kind="Platform" period="2026" />`

/** What the component's card on rost.build shows: a smaller Thumbs, without its own link, with one real component as its picture. */
export const preview = (
  <span style={{ display: 'block', width: 260 * 0.55, height: 222 * 0.55 }}>
    <span style={{ display: 'block', transform: 'scale(.55)', transformOrigin: 'top left' }}>
      <Thumbs as="div" number="01" name="akount.ing" showIndustry={false} showKind={false} showPeriod={false} style={{ width: 260, height: 222 }}>
        <span style={{ position: 'absolute', inset: 0, background: 'var(--non-interactive-background-primary)' }} />
        <span style={{ position: 'absolute', inset: '0 0 72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <InlineBanner status="positive" size="medium">Invoice sent</InlineBanner>
        </span>
      </Thumbs>
    </span>
  </span>
)

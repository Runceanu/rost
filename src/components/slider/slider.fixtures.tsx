import { Slider } from './Slider'

// One fixture per Figma variant, 240px wide, at 40 of 100. Focus is forced on the thumb.
type V = [state: 'Default' | 'Focus' | 'Disabled', node: string]
const VARIANTS: V[] = [['Default', '748:12'], ['Focus', '748:16'], ['Disabled', '748:21']]
export const fixtures = VARIANTS.map(([state, node]) => ({
  node,
  name: `state=${state}`,
  element: <div style={{ width: 240 }}><Slider label="Share set aside for tax" value={40} valueText="40%" disabled={state === 'Disabled'} /></div>,
  ...(state === 'Focus' ? { force: ['focus', 'focus-visible'], forceOn: '.rost-slider__thumb' } : {}),
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Slider } from 'rost/components/slider/Slider'

<Slider label="Share set aside for tax" value={share} valueText={\`\${share}%\`} onValueChange={setShare} />`

/** What the component's card on rost.build shows. */
export const preview = <div style={{ width: 200 }}><Slider label="Share set aside for tax" value={40} /></div>

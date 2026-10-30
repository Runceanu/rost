import { Illustration } from './Illustration'

/** One fixture per drawing in Figma's set. */
export const fixtures = [
  { node: '233:49', name: 'type=Activation & conversion', element: <Illustration name="activation-and-conversion" /> },
  { node: '41:569', name: 'type=Alignment', element: <Illustration name="alignment" /> },
  { node: '215:558', name: 'type=Art', element: <Illustration name="art" /> },
  { node: '41:566', name: 'type=Audit & Strategy', element: <Illustration name="audit-and-strategy" /> },
  { node: '215:531', name: 'type=Best idea', element: <Illustration name="best-idea" /> },
  { node: '41:564', name: 'type=Bridging the gaps', element: <Illustration name="bridging-the-gaps" /> },
  { node: '41:562', name: 'type=Design partner', element: <Illustration name="design-partner" /> },
  { node: '41:567', name: 'type=Design system', element: <Illustration name="design-system" /> },
  { node: '41:559', name: 'type=Design system leadership', element: <Illustration name="design-system-leadership" /> },
  { node: '233:61', name: 'type=Efficiency', element: <Illustration name="efficiency" /> },
  { node: '41:565', name: 'type=Goal focused', element: <Illustration name="goal-focused" /> },
  { node: '41:563', name: 'type=Implementing', element: <Illustration name="implementing" /> },
  { node: '41:560', name: 'type=Interactive showcase', element: <Illustration name="interactive-showcase" /> },
  { node: '41:558', name: 'type=Long term projects', element: <Illustration name="long-term-projects" /> },
  { node: '41:557', name: 'type=Mentoring', element: <Illustration name="mentoring" /> },
  { node: '41:568', name: 'type=Part of the team', element: <Illustration name="part-of-the-team" /> },
  { node: '41:555', name: 'type=Product design', element: <Illustration name="product-design" /> },
  { node: '233:55', name: 'type=Retention', element: <Illustration name="retention" /> },
  { node: '41:554', name: 'type=Scale team', element: <Illustration name="scale-team" /> },
  { node: '215:516', name: 'type=Ship best', element: <Illustration name="ship-best" /> },
  { node: '215:543', name: 'type=Simplicity v Complexity', element: <Illustration name="simplicity-v-complexity" /> },
  { node: '41:561', name: 'type=Structured system', element: <Illustration name="structured-system" /> },
  { node: '41:556', name: 'type=Timezones', element: <Illustration name="timezones" /> },
  { node: '215:524', name: 'type=UI', element: <Illustration name="ui" /> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Illustration } from 'rost/components/illustration/Illustration'

<Illustration name="structured-system" />
<Illustration name="timezones" label="Works across time zones" />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ display: 'inline-flex', gap: 'var(--spacing-gap-medium)' }}>{(['ui', 'structured-system', 'timezones'] as const).map((n) => <Illustration key={n} name={n} />)}</span>

import { Code } from './Code'
import { Text } from '../text/Text'

// Figma's code set (705:104): inline in body text, and a block 360 wide.
export const fixtures = [
  { node: '705:100', name: 'block=false', element: <Text as="span" tone="secondary" style={{ display: 'inline-block' }}><Code>non-interactive/foreground/positive/base</Code></Text> },
  { node: '705:102', name: 'block=true', element: <div style={{ width: 360 }}><Code block>{`<Link href="/docs/">Docs</Link>\n<Link tone="quiet">GitHub</Link>`}</Code></div> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Code } from 'rost/components/code/Code'

<p>Pass <Code>tone="quiet"</Code> for a footer.</p>
<Code block>{\`npm run deploy\`}</Code>
<Code block html={highlighted} />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ width: 200 }}><Code block>{`<Code block />`}</Code></span>

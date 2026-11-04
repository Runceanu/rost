import { Code } from './Code'
import { Text } from '../text/Text'

export const fixtures = [
  { node: 'code:inline', name: 'block=false', element: <Text tone="secondary">Its colour is <Code>non-interactive/foreground/positive/base</Code>.</Text> },
  { node: 'code:block', name: 'block=true', element: <div style={{ width: 360 }}><Code block>{`import { Link } from 'rost/components/link/Link'\n\n<Link href="/docs/">Docs</Link>`}</Code></div> },
]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Code } from 'rost/components/code/Code'

<p>Pass <Code>tone="quiet"</Code> for a footer.</p>
<Code block>{\`npm run deploy\`}</Code>
<Code block html={highlighted} />`

/** What the component's card on rost.build shows. */
export const preview = <span style={{ width: 200 }}><Code block>{`<Code block />`}</Code></span>

import { Tooltip } from './Tooltip'

/** Figma's tooltip with its sample label. */
export const fixtures = [{ node: '138:276', name: 'tooltip', element: <Tooltip>label</Tooltip> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Tooltip } from 'rost/components/tooltip/Tooltip'

<span className="has-tip" aria-describedby="tip-here">
  Work
  <Tooltip id="tip-here">You're already here</Tooltip>
</span>

/* Where and when is the page's: */
.has-tip { position: relative; }
.has-tip .rost-tooltip { position: absolute; top: calc(100% + 8px); left: 50%; translate: -50% 0; opacity: 0; pointer-events: none; }
.has-tip:is(:hover, :focus-within) .rost-tooltip { opacity: 1; }`

/** What the component's card on rost.build shows. */
export const preview = <Tooltip>You're already here</Tooltip>

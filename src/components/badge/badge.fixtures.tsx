import { Badge, type BadgeSize, type BadgeStatus } from './Badge'

/** One fixture per Figma variant, with Figma's own defaults (no leading dot on Medium). */
const VARIANTS: [BadgeStatus, BadgeSize, string][] = [
  ['default', 'small', '139:396'],
  ['default', 'medium', '346:3994'],
  ['negative', 'small', '139:433'],
  ['negative', 'medium', '346:3999'],
  ['positive', 'small', '139:439'],
  ['positive', 'medium', '346:4004'],
  ['warning', 'small', '139:445'],
  ['warning', 'medium', '346:4009'],
]

// Small badges have no text, so each gets a real label, the way a caller would.
const LABEL: Record<BadgeStatus, string> = { default: 'Draft', negative: 'Overdue', positive: 'Paid', warning: 'Due soon' }

export const fixtures = VARIANTS.map(([status, size, node]) => ({
  node,
  name: `status=${status}, size=${size}`,
  element: size === 'small'
    ? <Badge status={status} size="small" aria-label={LABEL[status]} />
    : <Badge status={status} size="medium">label</Badge>,
}))

/** What a caller writes. Shown on the component's page. */
export const usage = `import { Badge } from 'rost/components/badge/Badge'

<Badge status="negative">Overdue</Badge>
<Badge status="positive" showIcon>Paid</Badge>
<Badge status="warning" size="small" aria-label="Due soon" />`

/** What the component's card on rost.build shows. */
export const preview = (
  <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Badge status="positive">Paid</Badge>
    <Badge status="negative">Overdue</Badge>
    <Badge status="positive" size="small" aria-label="Paid" />
  </span>
)

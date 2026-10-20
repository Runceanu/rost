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

export const fixtures = VARIANTS.map(([status, size, node]) => ({
  node,
  name: `status=${status}, size=${size}`,
  element: size === 'small'
    ? <Badge status={status} size="small" aria-label={status} />
    : <Badge status={status} size="medium">label</Badge>,
}))

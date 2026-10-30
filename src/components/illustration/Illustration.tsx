import type { HTMLAttributes } from 'react'
import './illustration.css'

export const ILLUSTRATION_NAMES = ['activation-and-conversion', 'alignment', 'art', 'audit-and-strategy', 'best-idea', 'bridging-the-gaps', 'design-partner', 'design-system', 'design-system-leadership', 'efficiency', 'goal-focused', 'implementing', 'interactive-showcase', 'long-term-projects', 'mentoring', 'part-of-the-team', 'product-design', 'retention', 'scale-team', 'ship-best', 'simplicity-v-complexity', 'structured-system', 'timezones', 'ui'] as const
export type IllustrationName = (typeof ILLUSTRATION_NAMES)[number]

export interface IllustrationProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The file in `assets/illustrations/`, without `.svg`. */
  readonly name: IllustrationName
  /** What it stands for, when it carries meaning. Without it the drawing is hidden from screen readers. */
  readonly label?: string
}

const b = 'rost-illustration'

/**
 * A 72px drawing in its own colours. Built from
 * contracts/illustration.contract.yaml.
 */
export function Illustration({ name, label, className, ...rest }: IllustrationProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return <span className={[b, `${b}--name-${name}`, className].filter(Boolean).join(' ')} {...a11y} {...rest} />
}

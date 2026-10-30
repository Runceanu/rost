import type { HTMLAttributes } from 'react'
import './icon.css'

export const ICON_NAMES = ['arrow-down', 'arrow-down-left', 'arrow-left', 'arrow-right', 'arrow-up', 'chevron-down', 'chevron-left', 'chevron-right', 'chevron-up', 'circle-outline', 'desktop', 'dot', 'down-right', 'drag', 'mobile', 'scroll', 'up-left', 'up-right'] as const
export type IconName = (typeof ICON_NAMES)[number]
export type IconSize = 'medium' | 'small' | 'xsmall'

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The file in `assets/icons/`, without `.svg`. */
  readonly name: IconName
  /** Medium is Figma's 24px; Small (20px) fits Button's and IconButton's slot. */
  readonly size?: IconSize
  /** What it means, when nothing next to it says so. Without it the icon is hidden from screen readers. */
  readonly label?: string
}

const b = 'rost-icon'

/**
 * A glyph in the colour of the text around it. Built from
 * contracts/icon.contract.yaml.
 */
export function Icon({ name, size = 'medium', label, className, ...rest }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return <span className={[b, `${b}--name-${name}`, `${b}--size-${size}`, className].filter(Boolean).join(' ')} {...a11y} {...rest} />
}

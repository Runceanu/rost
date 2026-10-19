import type { ReactNode } from 'react'
import './inline-banner.css'

export type InlineBannerStatus = 'default' | 'negative' | 'positive' | 'warning'
export type InlineBannerSize = 'small' | 'medium'

export interface InlineBannerProps {
  readonly status?: InlineBannerStatus
  readonly size?: InlineBannerSize
  /**
   * The glyph. Each status has its own in Figma (plus, alarm, positive,
   * warning). Until those SVGs are exported, pass one in, or the space stays
   * empty at the right size.
   */
  readonly icon?: ReactNode
  readonly children: ReactNode
}

// Which icon part Figma uses for each status. The class carries its size and inset.
const ICON_PART: Record<InlineBannerStatus, string> = {
  default: 'icons-plus',
  negative: 'icons-alarm',
  positive: 'icons-positive',
  warning: 'icons-warning',
}

const b = 'rost-inline-banner'

/**
 * A filled status pill: a glyph and a short label. Built from
 * contracts/inline-banner.contract.yaml, and the layers follow the Figma
 * component one to one, so the generated CSS lands on the same parts.
 *
 * It's spans all the way down, so it can sit inside a sentence.
 */
export function InlineBanner({ status = 'default', size = 'medium', icon, children }: InlineBannerProps) {
  const glyph = (
    <span className={`${b}__${ICON_PART[status]}`} aria-hidden="true">
      <span className={`${b}__union`}>{icon}</span>
    </span>
  )
  return (
    <span className={`${b} ${b}--status-${status} ${b}--size-${size}`}>
      <span className={`${b}__background`} />
      {/* Figma wraps only the default glyph in a slot, so it can be swapped. */}
      {status === 'default' ? <span className={`${b}__slot`}>{glyph}</span> : glyph}
      <span className={`${b}__label`}>
        <span className={`${b}__text`}>{children}</span>
      </span>
    </span>
  )
}

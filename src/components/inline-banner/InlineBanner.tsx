import type { HTMLAttributes, ReactNode } from 'react'
import './inline-banner.css'
import plusSmall from './icons/plus-small.svg?url'
import plusMedium from './icons/plus-medium.svg?url'
import alarmSmall from './icons/alarm-small.svg?url'
import alarmMedium from './icons/alarm-medium.svg?url'
import positiveSmall from './icons/positive-small.svg?url'
import positiveMedium from './icons/positive-medium.svg?url'
import warningSmall from './icons/warning-small.svg?url'
import warningMedium from './icons/warning-medium.svg?url'

export type InlineBannerStatus = 'default' | 'negative' | 'positive' | 'warning'
export type InlineBannerSize = 'small' | 'medium'

export interface InlineBannerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly status?: InlineBannerStatus
  readonly size?: InlineBannerSize
  /** Default status only: replaces the plus, as Figma's slot does. */
  readonly icon?: ReactNode
  /** Default status only: hides the glyph and leaves just the label. */
  readonly showSlot?: boolean
  /** The label. */
  readonly children: ReactNode
}

// The exact icons Figma exports for each status and size.
const GLYPH: Record<InlineBannerStatus, { part: string; small: string; medium: string }> = {
  default: { part: 'icons-plus', small: plusSmall, medium: plusMedium },
  negative: { part: 'icons-alarm', small: alarmSmall, medium: alarmMedium },
  positive: { part: 'icons-positive', small: positiveSmall, medium: positiveMedium },
  warning: { part: 'icons-warning', small: warningSmall, medium: warningMedium },
}

const b = 'rost-inline-banner'

/**
 * A filled status pill: a glyph and a short label. Built from
 * contracts/inline-banner.contract.yaml, following the Figma layers, so the
 * generated CSS lands on the same parts. It's spans all the way down and
 * sits inline, so it can go inside a sentence.
 *
 * Pass `role="status"` (or `role="alert"` for negative) when it appears
 * because of something the person just did.
 */
export function InlineBanner({ status = 'default', size = 'small', icon, showSlot = true, children, className, ...rest }: InlineBannerProps) {
  const g = GLYPH[status]
  const glyph = (
    <span className={`${b}__${g.part}`} aria-hidden="true">
      <img src={g[size]} alt="" />
    </span>
  )
  return (
    <span className={[b, `${b}--status-${status}`, `${b}--size-${size}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__background`} />
      {status === 'default'
        ? showSlot && <span className={`${b}__slot`}>{icon ?? glyph}</span>
        : glyph}
      <span className={`${b}__label`}>
        <span className={`${b}__text`}>{children}</span>
      </span>
    </span>
  )
}

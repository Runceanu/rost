import type { HTMLAttributes, ReactNode } from 'react'
import './inline-banner.css'

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

// Which glyph each status draws. Its shape is a mask in the contract; its colour, the status token.
const GLYPH: Record<InlineBannerStatus, string> = {
  default: 'icons-plus',
  negative: 'icons-alarm',
  positive: 'icons-positive',
  warning: 'icons-warning',
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
  // A mask in the status colour; the shape is the contract's.
  const glyph = <span className={`${b}__${g}`} aria-hidden="true" />
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

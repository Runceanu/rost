import type { ReactNode } from 'react'
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

export interface InlineBannerProps {
  readonly status?: InlineBannerStatus
  readonly size?: InlineBannerSize
  /** Swaps the glyph. Figma only allows this on `default`, where the glyph sits in a slot. */
  readonly icon?: ReactNode
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
 * contracts/inline-banner.contract.yaml, with the layers following the Figma
 * component one to one, so the generated CSS lands on the same parts.
 *
 * It's spans all the way down, so it can sit inside a sentence.
 */
export function InlineBanner({ status = 'default', size = 'medium', icon, children }: InlineBannerProps) {
  const g = GLYPH[status]
  const glyph = (
    <span className={`${b}__${g.part}`} aria-hidden="true">
      {status === 'default' && icon ? icon : <img src={g[size]} alt="" />}
    </span>
  )
  return (
    <span className={`${b} ${b}--status-${status} ${b}--size-${size}`}>
      <span className={`${b}__background`} />
      {status === 'default' ? <span className={`${b}__slot`}>{glyph}</span> : glyph}
      <span className={`${b}__label`}>
        <span className={`${b}__text`}>{children}</span>
      </span>
    </span>
  )
}

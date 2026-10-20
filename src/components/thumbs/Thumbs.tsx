import { Fragment, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Badge } from '../badge/Badge'
import './thumbs.css'
import iconLock from './icon-lock.svg?url'

export interface ThumbsProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> {
  /** The project's name, in the title. */
  readonly name?: ReactNode
  /** A two-digit index in front of the name. */
  readonly number?: ReactNode
  readonly industry?: ReactNode
  readonly type?: ReactNode
  readonly period?: ReactNode
  readonly showNumber?: boolean
  readonly showName?: boolean
  readonly showIndustry?: boolean
  readonly showType?: boolean
  readonly showPeriod?: boolean
  /** Dims the card, drops the link and shows `badge`. */
  readonly disabled?: boolean
  /** The pill on a disabled card. */
  readonly badge?: ReactNode
  /** Puts the green lock in the corner, for work behind a password. */
  readonly locked?: boolean
  /** What fills the card: an image, usually. */
  readonly children?: ReactNode
  /**
   * `div` draws the card without the link, for a preview inside something
   * that's already a link (a link can't hold another). It has no states then.
   */
  readonly as?: 'a' | 'div'
}

const b = 'rost-thumbs'

/**
 * A project card. The whole card is one link; hover, pressed and focus are
 * the browser's own states. Built from contracts/thumbs.contract.yaml,
 * following the Figma layers.
 */
export function Thumbs({
  name = 'Client', number = '00', industry = 'Industry', type = 'Type', period = 'Period',
  showNumber = true, showName = true, showIndustry = true, showType = true, showPeriod = true,
  disabled = false, badge = 'Coming soon', locked = false, children, className, href, as = 'a', ...rest
}: ThumbsProps) {
  const cls = [b, locked && `${b}--state-locked`, className].filter(Boolean).join(' ')
  // The details with a dot between each pair, whichever are shown.
  const details = [showIndustry && industry, showType && type, showPeriod && period].filter((d) => d !== false)
  const Root = as
  const link = as === 'a' ? { href: disabled ? undefined : href, 'aria-disabled': disabled || undefined } : {}
  return (
    <Root className={cls} {...link} {...(rest as object)}>
      <span className={`${b}__slot`}>{children}</span>
      <span className={`${b}__shadow`} />
      <span className={`${b}__focus-ring`} />
      <span className={`${b}__content`}>
        <span className={`${b}__title`}>
          <span className={`${b}__number`}>{showNumber && number}</span>
          {showName && <span className={`${b}__text`}>{name}</span>}
        </span>
        <span className={`${b}__bottom`}>
          {details.map((d, i) => (
            <Fragment key={i}>
              {i > 0 && <span className={`${b}__icons-dot`} aria-hidden="true"><span className={`${b}__dot`} /></span>}
              <span className={`${b}__detail`}>{d}</span>
            </Fragment>
          ))}
        </span>
      </span>
      {disabled && badge && <span className={`${b}__badge`}><Badge>{badge}</Badge></span>}
      {locked && (
        <span className={`${b}__locked`}>
          <span className={`${b}__icons-lock`}><img src={iconLock} alt="Locked" /></span>
        </span>
      )}
    </Root>
  )
}

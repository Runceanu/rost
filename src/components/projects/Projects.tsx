import { Fragment, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Badge } from '../badge/Badge'
import './projects.css'

export interface ProjectsProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> {
  /** A two-digit index in front of the name. */
  readonly number?: ReactNode
  readonly name?: ReactNode
  readonly industry?: ReactNode
  readonly type?: ReactNode
  readonly period?: ReactNode
  readonly showNumber?: boolean
  readonly showName?: boolean
  readonly showIndustry?: boolean
  readonly showType?: boolean
  readonly showPeriod?: boolean
  /** The arrow at the end of the row. */
  readonly showAction?: boolean
  /** The line under the row. */
  readonly showDivider?: boolean
  /** Fades the row, drops the link and shows `badge`. */
  readonly disabled?: boolean
  /** The pill after the name on a disabled row. */
  readonly badge?: ReactNode
  /** Puts a green lock after the name, for work behind a password. */
  readonly locked?: boolean
  /** `div` draws it without the link, for a preview inside something that's already a link. */
  readonly as?: 'a' | 'div'
}

const b = 'rost-projects'

/**
 * One row in a list of projects. The whole row is a link; hover, press and
 * focus are the browser's. Built from contracts/projects.contract.yaml.
 */
export function Projects({
  number = '00', name = 'Name', industry = 'Industry', type = 'Type', period = 'Period',
  showNumber = true, showName = true, showIndustry = true, showType = true, showPeriod = true,
  showAction = true, showDivider = true, disabled = false, badge = 'Coming soon', locked = false,
  className, href, as = 'a', ...rest
}: ProjectsProps) {
  const cls = [b, locked && `${b}--state-locked`, className].filter(Boolean).join(' ')
  const details = [showIndustry && industry, showType && type, showPeriod && period].filter((d) => d !== false)
  const Root = as
  const link = as === 'a' ? { href: disabled ? undefined : href, 'aria-disabled': disabled || undefined } : {}
  return (
    <Root className={cls} {...link} {...(rest as object)}>
      {showDivider && <span className={`${b}__outline`} />}
      <span className={`${b}__left`}>
        {showNumber && <span className={`${b}__number`}>{number}</span>}
        {showName && <span className={`${b}__text`}>{name}</span>}
        {locked && <span className={`${b}__icons-lock`} role="img" aria-label="Locked" />}
        {disabled && badge && <span className={`${b}__badge`}><Badge>{badge}</Badge></span>}
      </span>
      <span className={`${b}__right`}>
        {details.map((d, i) => (
          <Fragment key={i}>
            {i > 0 && <span className={`${b}__icons-dot`} aria-hidden="true"><span className={`${b}__dot`} /></span>}
            <span className={`${b}__detail`}>{d}</span>
          </Fragment>
        ))}
      </span>
      {showAction && <span className={`${b}__actions`} aria-hidden="true"><span className={`${b}__icons-arrow`} /></span>}
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}

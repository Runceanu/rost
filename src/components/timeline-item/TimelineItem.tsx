import type { LiHTMLAttributes, ReactNode } from 'react'
import './timeline-item.css'

export interface TimelineItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> {
  /** The event that says where things stand now. Its dot is green. */
  readonly current?: boolean
  /** The bottom one. Timeline sets it. */
  readonly last?: boolean
  /** What happened, in a few words. */
  readonly title: ReactNode
  /** When. */
  readonly time: ReactNode
  /** Machine-readable form of `time`, for the `<time>` element. */
  readonly dateTime?: string
  /** A sentence more. */
  readonly children?: ReactNode
}

const b = 'rost-timeline-item'

/** One event in a Timeline. Built from contracts/timeline-item.contract.yaml. */
export function TimelineItem({ current = false, last = false, title, time, dateTime, children, className, ...rest }: TimelineItemProps) {
  return (
    <li className={[b, current && `${b}--current`, last && `${b}--last`, className].filter(Boolean).join(' ')} aria-current={current ? 'step' : undefined} {...rest}>
      <span className={`${b}__rail`} aria-hidden="true">
        <span className={`${b}__dot`} />
        <span className={`${b}__line`} />
      </span>
      <span className={`${b}__content`}>
        <p className={`${b}__title`}>{title}</p>
        <time className={`${b}__time`} dateTime={dateTime}>{time}</time>
        {children != null && <p className={`${b}__body`}>{children}</p>}
      </span>
    </li>
  )
}

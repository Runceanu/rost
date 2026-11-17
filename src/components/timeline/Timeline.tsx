import { Children, cloneElement, isValidElement, type OlHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import type { TimelineItemProps } from '../timeline-item/TimelineItem'
import './timeline.css'

export interface TimelineProps extends OlHTMLAttributes<HTMLOListElement> {
  /** The TimelineItems, in order. */
  readonly children: ReactNode
}

const b = 'rost-timeline'

/** What happened to something, in order. Built from contracts/timeline.contract.yaml. */
export function Timeline({ children, className, ...rest }: TimelineProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<TimelineItemProps>[]
  return (
    <ol className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {items.map((item, i) => (i === items.length - 1 ? cloneElement(item, { last: true }) : item))}
    </ol>
  )
}

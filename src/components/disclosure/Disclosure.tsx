import type { DetailsHTMLAttributes, ReactNode } from 'react'
import { Icon } from '../icon/Icon'
import './disclosure.css'

export interface DisclosureProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'summary'> {
  /** What's inside, in a few words. Always shown. */
  readonly summary: ReactNode
  /** Starts open. */
  readonly open?: boolean
  /** What opens. */
  readonly children?: ReactNode
}

const b = 'rost-disclosure'

/** A line that opens to show more. Built from contracts/disclosure.contract.yaml. */
export function Disclosure({ summary, open, className, children, ...rest }: DisclosureProps) {
  return (
    <details className={[b, className].filter(Boolean).join(' ')} open={open} {...rest}>
      <summary className={`${b}__summary`}><Icon name="chevron-right" size="small" className={`${b}__icon`} />{summary}</summary>
      <div className={`${b}__panel`}>{children}</div>
    </details>
  )
}

import type { HTMLAttributes, ReactNode } from 'react'
import './quote.css'

export interface QuoteProps extends HTMLAttributes<HTMLElement> {
  /** The words, without quote marks. */
  readonly children: ReactNode
  /** Who said it. */
  readonly cite?: ReactNode
}

const b = 'rost-quote'

/** Someone's words, pulled out of the text. Built from contracts/quote.contract.yaml. */
export function Quote({ children, cite, className, ...rest }: QuoteProps) {
  return (
    <figure className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__rule`} aria-hidden="true" />
      <div className={`${b}__content`}>
        <blockquote className={`${b}__text`}>{children}</blockquote>
        {cite != null && <figcaption className={`${b}__cite`}>{cite}</figcaption>}
      </div>
    </figure>
  )
}

import type { HTMLAttributes, ReactNode } from 'react'
import { Disclosure } from '../disclosure/Disclosure'
import './accordion.css'

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  /** Each a summary and what opens. */
  readonly items: readonly { readonly summary: ReactNode; readonly content: ReactNode; readonly open?: boolean }[]
}

const b = 'rost-accordion'

/** Disclosures in a column, a line between each. Built from contracts/accordion.contract.yaml. */
export function Accordion({ items, className, ...rest }: AccordionProps) {
  return (
    <div className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {items.map((item, i) => <Disclosure key={i} className={`${b}__item`} summary={item.summary} open={item.open}>{item.content}</Disclosure>)}
    </div>
  )
}

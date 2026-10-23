import type { HTMLAttributes, ReactNode } from 'react'
import './tooltip.css'

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  /** A few words. Link it from what it explains with `aria-describedby`. */
  readonly children?: ReactNode
}

const b = 'rost-tooltip'

/**
 * The bubble: a few words on the secondary surface. Where it sits and when
 * it shows is the page's (8px under the thing it explains, on hover and
 * focus). Built from contracts/tooltip.contract.yaml.
 */
export function Tooltip({ children, className, ...rest }: TooltipProps) {
  return (
    <span role="tooltip" className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__label`}>{children}</span>
    </span>
  )
}

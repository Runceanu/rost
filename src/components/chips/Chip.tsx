import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './chips.css'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** One or two words. */
  readonly children?: ReactNode
}

const b = 'rost-chips'

/**
 * A filter or a quick pick. Always a button: hover, press and focus are the
 * browser's. There's no selected chip in the kit yet, so there's no
 * `selected` prop either. Built from contracts/chips.contract.yaml.
 */
export function Chip({ children, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} className={[b, `${b}--status-default`, className].filter(Boolean).join(' ')} {...rest}>
      <span className={`${b}__label`}>{children}</span>
      <span className={`${b}__outline`} />
      <span className={`${b}__focus-ring`} />
    </button>
  )
}

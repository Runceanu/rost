import type { HTMLAttributes, ReactNode } from 'react'
import './kbd.css'

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** The key, as it's printed on the keyboard. */
  readonly children: ReactNode
}

/** A key on the keyboard, in the text. Built from contracts/kbd.contract.yaml. */
export function Kbd({ className, children, ...rest }: KbdProps) {
  return <kbd className={['rost-kbd', className].filter(Boolean).join(' ')} {...rest}>{children}</kbd>
}

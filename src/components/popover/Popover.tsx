import type { HTMLAttributes, ReactNode } from 'react'
import './popover.css'

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  /** What its button points at with `popovertarget`. */
  readonly id: string
  /** Draws the plate in place, always open, for previews. */
  readonly preview?: boolean
  readonly children?: ReactNode
}

const b = 'rost-popover'

/**
 * A small plate that opens over the page. The browser's popover: a
 * `<button popovertarget={id}>` opens it, Esc and a click outside close it.
 * Where it sits is the page's job. Built from contracts/popover.contract.yaml.
 */
export function Popover({ id, preview = false, children, className, ...rest }: PopoverProps) {
  const cls = [b, className].filter(Boolean).join(' ')
  const panel = <div className={`${b}__panel`}>{children}</div>
  if (preview) return <div id={id} className={cls} {...rest}>{panel}</div>
  return <div id={id} popover="auto" className={cls} {...rest}>{panel}</div>
}

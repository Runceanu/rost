import type { HTMLAttributes, ReactNode } from 'react'
import './card.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly tone?: 'filled' | 'outlined'
  /** `section` when the card has a heading and is a part of the page someone would jump to. */
  readonly as?: 'div' | 'section' | 'article'
  readonly children?: ReactNode
}

const b = 'rost-card'

/**
 * A plate that holds one thing together. It lays out what's inside in a
 * column and adds no type of its own. Built from contracts/card.contract.yaml.
 */
export function Card({ tone = 'filled', as: As = 'div', className, children, ...rest }: CardProps) {
  return <As className={[b, `${b}--tone-${tone}`, className].filter(Boolean).join(' ')} {...rest}>{children}</As>
}

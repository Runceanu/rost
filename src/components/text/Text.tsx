import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import './text.css'

export type TextVariant = 'display' | 'headline' | 'sub-headline' | 'lede' | 'body' | 'paragraph' | 'label' | 'eyebrow'

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** The size, from the ramp. */
  readonly variant?: TextVariant
  /** The colour. Left out, the colour around it. */
  readonly tone?: 'primary' | 'secondary' | 'tertiary' | 'positive' | 'warning' | 'negative'
  /** Left out, the variant's own weight. */
  readonly weight?: 'regular' | 'medium'
  /** The element, by meaning: `h1`, `h2`, `p`, `span`. */
  readonly as?: ElementType
  readonly children?: ReactNode
}

const b = 'rost-text'

/** Words, at one size of Rost's ramp. Built from contracts/text.contract.yaml. */
export function Text({ variant = 'body', tone, weight, as: As = 'p', className, children, ...rest }: TextProps) {
  const cls = [b, `${b}--variant-${variant}`, tone && `${b}--tone-${tone}`, weight && `${b}--weight-${weight}`, className].filter(Boolean).join(' ')
  return <As className={cls} {...rest}>{children}</As>
}

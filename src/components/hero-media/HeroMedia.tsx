import type { HTMLAttributes, ReactNode } from 'react'
import './hero-media.css'

export interface HeroMediaProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The artwork, behind everything and dimmed: a div with a background image, pinned with `background-attachment: fixed`. */
  readonly media?: ReactNode
  /** What sits on top of it, never dimmed: the title card, the client's logo. */
  readonly children?: ReactNode
}

const b = 'rost-hero-media'

/**
 * The hero at the top of a case study: a 630px section with a 16px frame,
 * and the artwork dimmed inside it. Both the artwork and what sits on top
 * are slots. Built from contracts/hero-media.contract.yaml.
 */
export function HeroMedia({ media, children, className, ...rest }: HeroMediaProps) {
  return (
    <header className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <div className={`${b}__frame`}>
        <div className={`${b}__media`} aria-hidden="true">{media}</div>
        <div className={`${b}__content`}>{children}</div>
      </div>
    </header>
  )
}

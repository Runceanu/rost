import type { AnchorHTMLAttributes, ReactNode } from 'react'
import './carousel.css'

export interface CarouselProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  /** A two-digit index in front of the title. */
  readonly number?: ReactNode
  readonly title?: ReactNode
  readonly description?: ReactNode
  readonly showNumber?: boolean
  readonly showTitle?: boolean
  readonly showDescription?: boolean
  /** Fades the card and drops the link. */
  readonly disabled?: boolean
  /** `div` draws it without the link, for a preview inside something that's already a link. */
  readonly as?: 'a' | 'div'
}

const b = 'rost-carousel'

/**
 * One card in a carousel of work: a number, a title and a line of
 * description. The whole card is a link; hover, press and focus are the
 * browser's. Built from contracts/carousel.contract.yaml.
 */
export function Carousel({
  number = '00', title = 'Title', description = 'Description',
  showNumber = true, showTitle = true, showDescription = true,
  disabled = false, className, href, as = 'a', ...rest
}: CarouselProps) {
  const Root = as
  const link = as === 'a' ? { href: disabled ? undefined : href, 'aria-disabled': disabled || undefined } : { 'aria-disabled': disabled || undefined }
  return (
    <Root className={[b, className].filter(Boolean).join(' ')} {...link} {...(rest as object)}>
      <span className={`${b}__background`} />
      <span className={`${b}__title`}>
        <span className={`${b}__number`}>{showNumber && number}</span>
        {showTitle && <span className={`${b}__text`}>{title}</span>}
      </span>
      <span className={`${b}__bottom`}>
        {showDescription && <span className={`${b}__description`}>{description}</span>}
      </span>
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}

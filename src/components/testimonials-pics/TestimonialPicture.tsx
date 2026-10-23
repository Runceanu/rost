import type { HTMLAttributes, ReactNode } from 'react'
import './testimonials-pics.css'

export interface TestimonialPictureProps extends HTMLAttributes<HTMLSpanElement> {
  /** The photo. */
  readonly src?: string
  /** Who it is, for screen readers. Empty when the name is right next to it, as in Testimonials. */
  readonly alt?: string
  /** Your own image instead of `src`, e.g. a framework's image component. Give it the `rost-testimonials-pics__image` class. */
  readonly children?: ReactNode
}

const b = 'rost-testimonials-pics'

/**
 * The photo of the person behind a testimonial: a 56px square that
 * Testimonials rounds. Built from contracts/testimonials-pics.contract.yaml.
 * Figma draws eight sample people; here the photo is a slot.
 */
export function TestimonialPicture({ src, alt = '', children, className, ...rest }: TestimonialPictureProps) {
  return (
    <span className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {children ?? (src && <img className={`${b}__image`} src={src} alt={alt} />)}
    </span>
  )
}

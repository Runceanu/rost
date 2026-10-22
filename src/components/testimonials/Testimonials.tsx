import { useId, useState, type HTMLAttributes, type ReactNode } from 'react'
import './testimonials.css'

export interface TestimonialsProps extends HTMLAttributes<HTMLDivElement> {
  readonly name?: ReactNode
  /** The person's role, under the name. */
  readonly jobDescription?: ReactNode
  /** The quote. Shown when it's open. */
  readonly testimonial?: ReactNode
  /** Open or closed. Leave it out and the component keeps its own state. */
  readonly expanded?: boolean
  /** Starts open, when it keeps its own state. */
  readonly defaultExpanded?: boolean
  readonly onExpandedChange?: (expanded: boolean) => void
  readonly showName?: boolean
  readonly showJobDescription?: boolean
  /** The chevron at the end. */
  readonly showAction?: boolean
  /** The line underneath. */
  readonly showDivider?: boolean
  readonly disabled?: boolean
  /** The 56px round picture: TestimonialPicture, or an image. */
  readonly children?: ReactNode
  /** `span` draws the header without its button, for a preview inside something that's already a link. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-testimonials'

/**
 * A testimonial that opens to show the quote. The header is the button; the
 * whole block takes its hover, press and focus. Built from
 * contracts/testimonials.contract.yaml.
 */
export function Testimonials({
  name = 'Name', jobDescription = 'Job description', testimonial = 'This is where the testimonial goes',
  expanded, defaultExpanded = false, onExpandedChange,
  showName = true, showJobDescription = true, showAction = true, showDivider = true,
  disabled = false, children, className, as = 'button', ...rest
}: TestimonialsProps) {
  const [own, setOwn] = useState(defaultExpanded)
  const open = expanded ?? own
  const quote = useId()
  const toggle = () => { if (expanded === undefined) setOwn(!open); onExpandedChange?.(!open) }
  const Top = as
  const header = as === 'button' ? { type: 'button' as const, 'aria-expanded': open, 'aria-controls': quote, disabled, onClick: toggle } : { 'aria-disabled': disabled || undefined }
  return (
    <div className={[b, open && `${b}--expanded`, className].filter(Boolean).join(' ')} {...rest}>
      {showDivider && <span className={`${b}__outline`} />}
      <Top className={`${b}__top`} {...header}>
        <span className={`${b}__left`}>
          <span className={`${b}__slot`}>{children}</span>
          <span className={`${b}__content`}>
            {showName && <span className={`${b}__text`}>{name}</span>}
            {showJobDescription && <span className={`${b}__job-description`}>{jobDescription}</span>}
          </span>
        </span>
        {showAction && <span className={`${b}__actions`} aria-hidden="true"><span className={`${b}__icons-chevron`} /></span>}
      </Top>
      <div className={`${b}__bottom`} id={quote} hidden={!open}>
        <p className={`${b}__testimonial`}>{testimonial}</p>
      </div>
      <span className={`${b}__focus-ring`} />
    </div>
  )
}

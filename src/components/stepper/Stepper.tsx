import { Children, Fragment, type HTMLAttributes, type ReactNode } from 'react'
import './stepper.css'

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  /** The Steps, in order. */
  readonly children: ReactNode
}

const b = 'rost-stepper'

/**
 * The Steps in a row, a short line between each. Built from
 * contracts/stepper.contract.yaml.
 */
export function Stepper({ children, className, 'aria-label': label = 'Progress', ...rest }: StepperProps) {
  const steps = Children.toArray(children)
  return (
    <ol aria-label={label} className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {steps.map((step, i) => (
        <Fragment key={i}>
          {i > 0 && <li className={`${b}__connector`} aria-hidden="true" role="presentation" />}
          {step}
        </Fragment>
      ))}
    </ol>
  )
}

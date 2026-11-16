import type { HTMLAttributes, ReactNode } from 'react'
import './step.css'

export interface StepProps extends HTMLAttributes<HTMLLIElement> {
  readonly status?: 'done' | 'current' | 'upcoming'
  /** Its place, from 1. */
  readonly number: number
  /** Its name. */
  readonly children: ReactNode
}

const b = 'rost-step'

/** One step of a Stepper. Built from contracts/step.contract.yaml. */
export function Step({ status = 'upcoming', number, children, className, ...rest }: StepProps) {
  return (
    <li className={[b, `${b}--status-${status}`, className].filter(Boolean).join(' ')} aria-current={status === 'current' ? 'step' : undefined} {...rest}>
      <span className={`${b}__marker`} aria-hidden="true">{status === 'done' ? <span className={`${b}__check`} /> : number}</span>
      <span className={`${b}__label`}>{children}{status === 'done' && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>, done</span>}</span>
    </li>
  )
}

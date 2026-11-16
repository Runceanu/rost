import type { FieldsetHTMLAttributes, ReactNode } from 'react'
import './fieldset.css'

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** The question the choices answer. */
  readonly legend: ReactNode
  /** One line under the choices. */
  readonly help?: ReactNode
  readonly children: ReactNode
}

const b = 'rost-fieldset'

/** A question with its choices. Built from contracts/fieldset.contract.yaml. */
export function Fieldset({ legend, help, children, className, ...rest }: FieldsetProps) {
  return (
    <fieldset className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <legend className={`${b}__legend`}>{legend}</legend>
      <div className={`${b}__options`}>{children}</div>
      {help != null && <p className={`${b}__help`}>{help}</p>}
    </fieldset>
  )
}

import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { Switch } from '../switch/Switch'
import './switch-field.css'

export interface SwitchFieldProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  /** What it turns on: "Email me receipts". */
  readonly children: ReactNode
  /** Which side of the switch the label sits. */
  readonly side?: 'left' | 'right'
  /** On or off, when you control it. */
  readonly checked?: boolean
  /** Where it starts when it looks after itself. */
  readonly defaultChecked?: boolean
  /** Called with the new value each time it flips. */
  readonly onCheckedChange?: (checked: boolean) => void
  /** Disables the switch and fades the label. */
  readonly disabled?: boolean
  /** The switch's id, if you need it. One is made otherwise. */
  readonly switchId?: string
}

const b = 'rost-switch-field'

/**
 * A Switch with its label beside it, on the left or the right. The label is a
 * `<label for>` the switch, so it names it and a click on it flips it. Built
 * from contracts/switch-field.contract.yaml.
 */
export function SwitchField({ children, side = 'right', checked, defaultChecked, onCheckedChange, disabled = false, switchId, className, ...rest }: SwitchFieldProps) {
  const made = useId()
  const id = switchId ?? made
  return (
    <span className={[b, `${b}--side-${side}`, disabled && `${b}--disabled`, className].filter(Boolean).join(' ')} {...rest}>
      <Switch id={id} className={`${b}__switch`} checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <label className={`${b}__label`} htmlFor={id}>{children}</label>
    </span>
  )
}

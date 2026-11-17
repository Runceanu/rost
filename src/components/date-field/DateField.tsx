import { useId, useRef, useState, type ReactNode } from 'react'
import { Calendar } from '../calendar/Calendar'
import { Popover } from '../popover/Popover'
import './date-field.css'

export interface DateFieldProps {
  /** The field's name, small at the top. */
  readonly label: ReactNode
  /** The picked date. */
  readonly value?: Date | null
  readonly onValueChange?: (date: Date) => void
  /** What the field says before there's a date. */
  readonly placeholder?: string
  readonly min?: Date
  readonly max?: Date
  /** Today, for the Calendar. The real today by default. */
  readonly today?: Date
  readonly locale?: string
  /** One line under the field: help, or what to fix. */
  readonly supportive?: ReactNode
  /** Select's red. Say what's wrong in `supportive`. */
  readonly error?: boolean
  readonly disabled?: boolean
  readonly id?: string
  readonly className?: string
}

const b = 'rost-date-field'

/**
 * A date, picked from a Calendar. Select's field as a button, and the
 * Calendar in a Popover under it. Built from contracts/date-field.contract.yaml.
 */
export function DateField({ label, value = null, onValueChange, placeholder = 'Pick a date', min, max, today, locale = 'en', supportive, error = false, disabled = false, id, className }: DateFieldProps) {
  const made = useId()
  const fieldId = id ?? made
  const popId = `${fieldId}-calendar`
  const helpId = `${fieldId}-help`
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const text = value ? value.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder
  return (
    <div className={[b, error && `${b}--error`, className].filter(Boolean).join(' ')}>
      <span className={`${b}__outline`} aria-hidden="true" />
      <button
        ref={button}
        id={fieldId}
        type="button"
        className={`${b}__field`}
        disabled={disabled}
        popoverTarget={popId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error || undefined}
        aria-describedby={supportive != null ? helpId : undefined}
      >
        {text}
      </button>
      <label className={`${b}__label`} htmlFor={fieldId}>{label}</label>
      <span className={`${b}__chevron`} aria-hidden="true" />
      {supportive != null && <span id={helpId} className={`${b}__supportive`}>{supportive}</span>}
      <span className={`${b}__focus-ring`} aria-hidden="true" />
      <Popover
        fit
        id={popId}
        role="dialog"
        aria-labelledby={fieldId}
        onToggle={(e) => setOpen((e as unknown as ToggleEvent).newState === 'open')}
      >
        {open && (
          <Calendar
            autoFocus
            value={value}
            today={today}
            min={min}
            max={max}
            locale={locale}
            onValueChange={(d) => {
              onValueChange?.(d)
              document.getElementById(popId)?.hidePopover()
              button.current?.focus()
            }}
          />
        )}
      </Popover>
    </div>
  )
}

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import './calendar-day.css'

export type CalendarDayStatus = 'default' | 'outside' | 'today' | 'selected' | 'disabled'

export interface CalendarDayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly status?: CalendarDayStatus
  /** The day's number. */
  readonly children: ReactNode
}

const b = 'rost-calendar-day'

/** One day in a Calendar. Built from contracts/calendar-day.contract.yaml. */
export const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(function CalendarDay({ status = 'default', children, className, ...rest }, ref) {
  return (
    <button ref={ref} type="button" className={[b, `${b}--status-${status}`, className].filter(Boolean).join(' ')} aria-disabled={status === 'disabled' || undefined} {...rest}>
      {children}
    </button>
  )
})

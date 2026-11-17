import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react'
import { CalendarDay, type CalendarDayStatus } from '../calendar-day/CalendarDay'
import { IconButton } from '../icon-button/IconButton'
import { Icon } from '../icon/Icon'
import './calendar.css'

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The picked date. */
  readonly value?: Date | null
  readonly onValueChange?: (date: Date) => void
  /** The month shown, any date in it. Leave it out and the Calendar keeps its own. */
  readonly month?: Date
  readonly onMonthChange?: (month: Date) => void
  /** Today. The real today by default. */
  readonly today?: Date
  /** The first date that can be picked. */
  readonly min?: Date
  /** The last date that can be picked. */
  readonly max?: Date
  /** 0 for Sunday, 1 for Monday. */
  readonly weekStartsOn?: number
  readonly locale?: string
}

const b = 'rost-calendar'
const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last))
}
const same = (a?: Date | null, c?: Date | null) => !!a && !!c && a.getFullYear() === c.getFullYear() && a.getMonth() === c.getMonth() && a.getDate() === c.getDate()
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

/**
 * A month to pick a date from. A `role="grid"` of CalendarDays with one in
 * the tab order; the arrow keys move between them. Built from
 * contracts/calendar.contract.yaml.
 */
export function Calendar({ value = null, onValueChange, month, onMonthChange, today: todayProp, min, max, weekStartsOn = 1, locale = 'en', className, ...rest }: CalendarProps) {
  const today = day(todayProp ?? new Date())
  const [ownMonth, setOwnMonth] = useState(() => day(month ?? value ?? today))
  const shown = month ?? ownMonth
  const first = new Date(shown.getFullYear(), shown.getMonth(), 1)
  const [focus, setFocus] = useState<Date>(() => (value && same(new Date(value.getFullYear(), value.getMonth(), 1), first) ? day(value) : same(new Date(today.getFullYear(), today.getMonth(), 1), first) ? today : first))
  const moved = useRef(false)
  const grid = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const disabled = (d: Date) => (!!min && d < day(min)) || (!!max && d > day(max))
  const go = (m: Date) => { const f = new Date(m.getFullYear(), m.getMonth(), 1); setOwnMonth(f); onMonthChange?.(f) }
  // Keep the focused day inside the month on show.
  const focusDay = focus.getMonth() === shown.getMonth() && focus.getFullYear() === shown.getFullYear()
    ? focus
    : value && value.getMonth() === shown.getMonth() && value.getFullYear() === shown.getFullYear() ? day(value) : first

  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${key(focusDay)}"]`)?.focus()
  })

  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const start = addDays(first, -lead)
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const weekdays = days.slice(0, 7)

  const moveTo = (d: Date) => {
    moved.current = true
    setFocus(d)
    if (d.getMonth() !== shown.getMonth() || d.getFullYear() !== shown.getFullYear()) go(d)
  }
  const pick = (d: Date) => {
    if (disabled(d)) return
    onValueChange?.(d)
    moveTo(d)
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const pos = (focusDay.getDay() - weekStartsOn + 7) % 7
    const to = {
      ArrowRight: addDays(focusDay, 1), ArrowLeft: addDays(focusDay, -1), ArrowDown: addDays(focusDay, 7), ArrowUp: addDays(focusDay, -7),
      Home: addDays(focusDay, -pos), End: addDays(focusDay, 6 - pos), PageUp: addMonths(focusDay, e.shiftKey ? -12 : -1), PageDown: addMonths(focusDay, e.shiftKey ? 12 : 1),
    }[e.key]
    if (to) { e.preventDefault(); moveTo(to) }
  }

  const status = (d: Date): CalendarDayStatus =>
    disabled(d) ? 'disabled' : same(d, value) ? 'selected' : d.getMonth() !== shown.getMonth() ? 'outside' : same(d, today) ? 'today' : 'default'
  const full = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <div className={`${b}__header`}>
        <IconButton variant="tertiary" aria-label="Previous month" icon={<Icon name="chevron-left" size="small" />} onClick={() => go(addMonths(first, -1))} />
        <h2 className={`${b}__title`} id={titleId} aria-live="polite">{first.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h2>
        <IconButton variant="tertiary" aria-label="Next month" icon={<Icon name="chevron-right" size="small" />} onClick={() => go(addMonths(first, 1))} />
      </div>
      <div ref={grid} className={`${b}__grid`} role="grid" aria-labelledby={titleId} onKeyDown={onKey}>
        <div className={`${b}__row`} role="row">
          {weekdays.map((d) => (
            <span key={d.getDay()} className={`${b}__weekday`} role="columnheader" aria-label={d.toLocaleDateString(locale, { weekday: 'long' })}>
              {d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2)}
            </span>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((w) => (
          <div key={w} className={`${b}__row`} role="row">
            {days.slice(w * 7, w * 7 + 7).map((d) => {
              const s = status(d)
              return (
                <span key={key(d)} className={`${b}__cell`} role="gridcell" aria-selected={same(d, value)}>
                  <CalendarDay
                    status={s}
                    data-date={key(d)}
                    tabIndex={same(d, focusDay) ? 0 : -1}
                    aria-label={full(d)}
                    aria-current={same(d, today) ? 'date' : undefined}
                    onClick={() => pick(d)}
                  >
                    {d.getDate()}
                  </CalendarDay>
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

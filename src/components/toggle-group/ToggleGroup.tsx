import { useLayoutEffect, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import './toggle-group.css'

export interface ToggleGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** What the choice is about, for screen readers: "Tax year". */
  readonly label: string
  /** The Toggle components, each with `role="radio"`, `selected` on the chosen one. */
  readonly children?: ReactNode
}

const radios = (group: HTMLElement) => [...group.querySelectorAll<HTMLButtonElement>('[role="radio"]')]

/**
 * A row of Toggles where one is chosen. Tab lands on the chosen one and the
 * next Tab leaves; arrow keys move to the next or previous and choose it,
 * Home and End go to the first and last, the way the ARIA radio group pattern
 * has it. Built from contracts/toggle-group.contract.yaml.
 */
export function ToggleGroup({ label, children, className, onKeyDown, ...rest }: ToggleGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  // One tab stop: the chosen toggle, or the first one that can be chosen when none is.
  useLayoutEffect(() => {
    const all = ref.current ? radios(ref.current) : []
    const stop = all.find((r) => r.getAttribute('aria-checked') === 'true' && !r.disabled) ?? all.find((r) => !r.disabled)
    for (const r of all) r.tabIndex = r === stop ? 0 : -1
  })
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    const all = radios(e.currentTarget).filter((r) => !r.disabled)
    const i = all.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? all[(i + 1) % all.length]
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? all[(i - 1 + all.length) % all.length]
      : e.key === 'Home' ? all[0] : e.key === 'End' ? all[all.length - 1] : null
    if (!next) return
    e.preventDefault()
    next.focus()
    next.click()
  }
  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={['rost-toggle-group', className].filter(Boolean).join(' ')} onKeyDown={move} {...rest}>
      {children}
    </div>
  )
}

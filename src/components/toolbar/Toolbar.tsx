import { useEffect, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import './toolbar.css'

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** What the tools act on, for screen readers. */
  readonly label: string
  /** Tertiary IconButtons, with a ToolbarSeparator between groups. */
  readonly children: ReactNode
}

const b = 'rost-toolbar'
const buttons = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'))

/**
 * A row of IconButtons that act on one thing. One button is in the tab order;
 * the arrow keys move between them. Built from contracts/toolbar.contract.yaml.
 */
export function Toolbar({ label, children, className, onKeyDown, onFocus, ...rest }: ToolbarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const roam = (to: HTMLElement) => { for (const el of buttons(ref.current!)) el.tabIndex = el === to ? 0 : -1 }
  useEffect(() => {
    const all = ref.current ? buttons(ref.current) : []
    if (all.length && !all.some((el) => el.getAttribute('tabindex') === '0')) roam(all[0])
  })
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    const all = buttons(ref.current!)
    const at = all.indexOf(document.activeElement as HTMLElement)
    if (at < 0) return
    const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: all.length - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    const next = all[(to + all.length) % all.length]
    roam(next)
    next.focus()
  }
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label}
      className={[b, className].filter(Boolean).join(' ')}
      onKeyDown={key}
      onFocus={(e) => { onFocus?.(e); if (e.target !== ref.current && buttons(ref.current!).includes(e.target as HTMLElement)) roam(e.target as HTMLElement) }}
      {...rest}
    >
      {children}
    </div>
  )
}

/** A thin upright line between two groups of buttons. */
export function ToolbarSeparator() {
  return <span className={`${b}__separator`} role="separator" aria-orientation="vertical" />
}

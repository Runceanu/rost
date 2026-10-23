import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import './tabs.css'

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** What the tabs switch between, for screen readers: "Button preview and code". */
  readonly 'aria-label': string
  /** The Tab components. */
  readonly children?: ReactNode
}

/**
 * A row of tabs on a 1px line. Arrow keys move to the next or previous tab
 * and select it, Home and End go to the first and last, the way the ARIA tabs
 * pattern has it. Built from contracts/tabs.contract.yaml.
 */
export function Tabs({ children, className, onKeyDown, ...rest }: TabsProps) {
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    const tabs = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')]
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    const to = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length]
      : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1] : null
    if (!to) return
    e.preventDefault()
    to.focus()
    to.click()
  }
  return <div role="tablist" className={['rost-tabs', className].filter(Boolean).join(' ')} onKeyDown={move} {...rest}>{children}</div>
}

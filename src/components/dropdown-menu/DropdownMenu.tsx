import { cloneElement, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import './dropdown-menu.css'

export interface DropdownMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The Button or IconButton that opens it. */
  readonly trigger: ReactElement<Record<string, unknown>>
  /** The menu's name, when the trigger's words don't say it. */
  readonly label?: string
  /** MenuItems, with a MenuSeparator between groups. */
  readonly children: ReactNode
  /** Draws the plate in place, always open, for previews. */
  readonly preview?: boolean
}

const b = 'rost-dropdown-menu'
const items = (menu: HTMLElement) => Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))

/**
 * A button that opens a short list of actions. The browser's popover with
 * `role="menu"`; the arrow keys move between the items. Built from
 * contracts/dropdown-menu.contract.yaml.
 */
export function DropdownMenu({ trigger, label, children, preview = false, id, className, ...rest }: DropdownMenuProps) {
  const made = useId()
  const menuId = id ?? `${made}-menu`
  const triggerId = `${menuId}-trigger`
  const menu = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const cls = [b, className].filter(Boolean).join(' ')

  if (preview) return <div id={menuId} role="menu" aria-label={label} className={cls} {...rest}>{children}</div>

  const close = () => { menu.current?.hidePopover(); document.getElementById(triggerId)?.focus() }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = items(menu.current!)
    const at = all.indexOf(document.activeElement as HTMLElement)
    const to = { ArrowDown: Math.min(at + 1, all.length - 1), ArrowUp: Math.max(at - 1, 0), Home: 0, End: all.length - 1 }[e.key]
    if (to !== undefined) { e.preventDefault(); all[to]?.focus(); return }
    if (e.key === 'Tab') close()
  }
  return (
    <>
      {cloneElement(trigger, { id: triggerId, popoverTarget: menuId, 'aria-haspopup': 'menu', 'aria-expanded': open })}
      <div
        ref={menu}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={label}
        aria-labelledby={label ? undefined : triggerId}
        className={cls}
        onKeyDown={key}
        onClick={(e) => { const item = (e.target as HTMLElement).closest('[role="menuitem"]'); if (item && item.getAttribute('aria-disabled') !== 'true') close() }}
        onToggle={(e) => {
          const now = (e as unknown as ToggleEvent).newState === 'open'
          setOpen(now)
          if (now) items(menu.current!)[0]?.focus()
        }}
        {...rest}
      >
        {children}
      </div>
    </>
  )
}

/** A thin line between two groups of items. */
export function MenuSeparator() {
  return <div className={`${b}__separator`} role="separator" />
}

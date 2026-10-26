import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './tab-item.css'

export interface TabItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The tab whose panel shows. It gets the green underline. */
  readonly selected?: boolean
  /** A 20px icon before the label. Draw it with `currentColor`. */
  readonly leading?: ReactNode
  /** A 20px icon after the label. Draw it with `currentColor`. */
  readonly trailing?: ReactNode
  /** The label. */
  readonly children?: ReactNode
  /** `span` draws it without the button, for a preview inside something that's already a link. */
  readonly as?: 'button' | 'span'
}

const b = 'rost-tab-item'

/**
 * One tab, always inside Tabs. A `<button role="tab">`: only the selected one
 * is in the tab order, and Tabs moves between them with the arrow keys.
 * Built from contracts/tab-item.contract.yaml.
 */
export function TabItem({ selected = false, leading, trailing, children, className, type = 'button', as = 'button', ...rest }: TabItemProps) {
  const Root = as
  const own = as === 'button' ? { type, role: 'tab', 'aria-selected': selected, tabIndex: selected ? 0 : -1 } : {}
  return (
    <Root
      {...own}
      className={[b, selected && `${b}--selected`, className].filter(Boolean).join(' ')}
      {...(rest as object)}
    >
      {leading && <span className={`${b}__leading`} aria-hidden="true">{leading}</span>}
      <span className={`${b}__label`}>{children}</span>
      {trailing && <span className={`${b}__trailing`} aria-hidden="true">{trailing}</span>}
      <span className={`${b}__underline`} />
      <span className={`${b}__focus-ring`} />
    </Root>
  )
}

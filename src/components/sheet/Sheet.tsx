import { useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from 'react'
import './sheet.css'

export interface SheetProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title'> {
  /** Shows it as a modal. */
  readonly open?: boolean
  /** What it asks or what it's for. */
  readonly title: ReactNode
  /** Its Buttons, the main one last. */
  readonly actions?: ReactNode
  /** Called when it closes, by Esc or otherwise. */
  readonly onClose?: () => void
  /** Draws the plate in place, without the modal, for previews. */
  readonly preview?: boolean
  readonly children?: ReactNode
}

const b = 'rost-sheet'

/**
 * A panel over the page from the right edge, full height. The browser's
 * `<dialog>`, opened with `showModal()`, so focus, Esc and the page behind
 * are the browser's. Built from contracts/sheet.contract.yaml.
 */
export function Sheet({ open = false, title, actions, onClose, preview = false, children, className, ...rest }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d || preview) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open, preview])
  const panel = (
    <div className={`${b}__panel`}>
      <h2 id={titleId} className={`${b}__title`}>{title}</h2>
      {children != null && <div className={`${b}__body`}>{children}</div>}
      {actions != null && <div className={`${b}__actions`}>{actions}</div>}
    </div>
  )
  const cls = [b, className].filter(Boolean).join(' ')
  if (preview) return <div className={cls} role="dialog" aria-labelledby={titleId}>{panel}</div>
  return <dialog ref={ref} className={cls} aria-labelledby={titleId} onClose={onClose} {...rest}>{panel}</dialog>
}

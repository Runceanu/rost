import { useId, useRef, useState, type DragEvent, type HTMLAttributes, type ReactNode } from 'react'
import { Button } from '../button/Button'
import { Icon } from '../icon/Icon'
import './dropzone.css'

export interface DropzoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What to drop. */
  readonly title: ReactNode
  /** What's allowed, or what went wrong. */
  readonly help?: ReactNode
  /** The button's words. */
  readonly action?: string
  /** Passed to the file input, like `.pdf,.csv`. */
  readonly accept?: string
  readonly multiple?: boolean
  /** The last file wasn't right. Say why in `help`. */
  readonly error?: boolean
  /** Shows the look of a file being dragged over it. The Dropzone sets this itself. */
  readonly over?: boolean
  readonly disabled?: boolean
  /** Gets the files, dropped or chosen. */
  readonly onFiles?: (files: File[]) => void
}

const b = 'rost-dropzone'

/** A place to drop a file, with a button too. Built from contracts/dropzone.contract.yaml. */
export function Dropzone({ title, help, action = 'Choose a file', accept, multiple, error = false, over, disabled, onFiles, className, ...rest }: DropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const helpId = useId()
  const isOver = (over ?? dragging) && !disabled
  const hand = (list: FileList | null) => { if (list?.length) onFiles?.(Array.from(list)) }
  const drag = (on: boolean) => (e: DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setDragging(on)
  }
  return (
    <div
      className={[b, isOver && `${b}--over`, error && !isOver && `${b}--error`, className].filter(Boolean).join(' ')}
      onDragEnter={drag(true)}
      onDragOver={drag(true)}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) drag(false)(e) }}
      onDrop={(e) => { drag(false)(e); if (!disabled) hand(e.dataTransfer.files) }}
      {...rest}
    >
      <span className={`${b}__icon`} aria-hidden="true"><Icon name="arrow-up" /></span>
      <span className={`${b}__words`}>
        <span className={`${b}__title`}>{title}</span>
        {help != null && <span className={`${b}__help`} id={helpId}>{help}</span>}
      </span>
      <input
        ref={input}
        className={`${b}__input`}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => { hand(e.currentTarget.files); e.currentTarget.value = '' }}
      />
      <Button variant="secondary" disabled={disabled} aria-describedby={help != null ? helpId : undefined} onClick={() => input.current?.click()}>{action}</Button>
    </div>
  )
}

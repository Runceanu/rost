import type { HTMLAttributes, ReactNode } from 'react'
import './code.css'

export interface CodeProps extends HTMLAttributes<HTMLElement> {
  /** A block of lines on its own plate. Without it, code in a sentence. */
  readonly block?: boolean
  /** Code already coloured by a highlighter, as HTML. */
  readonly html?: string
  /** The code as plain text, when there's no `html`. */
  readonly children?: ReactNode
}

const b = 'rost-code'

/** Code in a sentence, or a block of it. Built from contracts/code.contract.yaml. */
export function Code({ block = false, html, className, children, ...rest }: CodeProps) {
  const cls = [b, block && `${b}--block`, className].filter(Boolean).join(' ')
  const inner = html !== undefined ? { dangerouslySetInnerHTML: { __html: html } } : { children }
  if (!block) return <code className={cls} {...inner} {...rest} />
  // A block that scrolls can be scrolled from the keyboard.
  return <pre className={cls} tabIndex={0} {...rest}><code className={`${b}__text`} {...inner} /></pre>
}

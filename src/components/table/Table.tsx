import type { ReactNode, TableHTMLAttributes } from 'react'
import './table.css'

export interface TableProps extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** What the table is, drawn above the rows. Without one, give the table an `aria-label`. */
  readonly caption?: ReactNode
  /** A TableRow of column headers, for the `<thead>`. */
  readonly head?: ReactNode
  /** The TableRows, for the `<tbody>`. */
  readonly children?: ReactNode
}

const b = 'rost-table'

/**
 * Rows of the same kind of thing, in columns. A real `<table>` with no box of
 * its own: the rows draw the hairlines. Built from contracts/table.contract.yaml.
 */
export function Table({ caption, head, children, className, ...rest }: TableProps) {
  return (
    <table className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {caption && <caption className={`${b}__caption`}>{caption}</caption>}
      {head && <thead className={`${b}__head`}>{head}</thead>}
      <tbody className={`${b}__body`}>{children}</tbody>
    </table>
  )
}

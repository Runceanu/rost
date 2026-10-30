import { createContext, type HTMLAttributes, type ReactNode } from 'react'
import './table-row.css'

export interface TableRowProps extends Omit<HTMLAttributes<HTMLTableRowElement>, 'onSelect'> {
  /** Makes the row a link. The row's header cell holds it. */
  readonly href?: string
  /** Makes the row something you pick. The row's header cell holds the button. */
  readonly onSelect?: () => void
  /** The picked row: a dark green fill. */
  readonly selected?: boolean
  /** The TableItems, one per column. */
  readonly children?: ReactNode
}

/** What the row's header cell needs to be its link or button. */
export const RowAction = createContext<Pick<TableRowProps, 'href' | 'onSelect' | 'selected'>>({})

const b = 'rost-table-row'

/**
 * One row of a Table. A `<tr>` can't be a link, so with `href` or `onSelect`
 * the row's header cell (TableItem `header="row"`) becomes the link or button,
 * stretched over the whole row. Hover, press and focus are drawn on the row.
 * Built from contracts/table-row.contract.yaml.
 */
export function TableRow({ href, onSelect, selected = false, children, className, ...rest }: TableRowProps) {
  return (
    <tr className={[b, selected && `${b}--selected`, className].filter(Boolean).join(' ')} {...rest}>
      <RowAction.Provider value={{ href, onSelect, selected }}>{children}</RowAction.Provider>
    </tr>
  )
}

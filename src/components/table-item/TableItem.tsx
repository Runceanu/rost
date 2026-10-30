import { useContext, type ReactNode, type TdHTMLAttributes } from 'react'
import { RowAction } from '../table-row/TableRow'
import './table-item.css'

export interface TableItemProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** `row` names its row (`<th scope="row">`) and holds the row's link; `column` is a column header. */
  readonly header?: 'row' | 'column'
  /** For amounts: on the right, on one line. */
  readonly numeric?: boolean
  /** A line under the content, in the quieter colour. */
  readonly description?: ReactNode
  /** Before the content: a Badge, or an icon drawn with `currentColor`. */
  readonly leading?: ReactNode
  /** After the content: a Badge, or an icon drawn with `currentColor`. */
  readonly trailing?: ReactNode
  /** What the cell says. */
  readonly children?: ReactNode
}

const b = 'rost-table-item'

/**
 * One cell of a TableRow, with leading and trailing slots. A `<td>`, or a
 * `<th>` when it's a header. Built from contracts/table-item.contract.yaml.
 */
export function TableItem({ header, numeric = false, description, leading, trailing, children, className, ...rest }: TableItemProps) {
  const { href, onSelect, selected } = useContext(RowAction)
  const cls = [b, header && `${b}--header-${header}`, numeric && `${b}--numeric`, className].filter(Boolean).join(' ')
  const content = (
    <span className={`${b}__content`}>
      {leading && <span className={`${b}__leading`}>{leading}</span>}
      <span className={`${b}__text`}>
        <span className={`${b}__label`}>{children}</span>
        {description && <span className={`${b}__description`}>{description}</span>}
      </span>
      {trailing && <span className={`${b}__trailing`}>{trailing}</span>}
    </span>
  )
  // Only the row's header cell carries the row's link or button.
  const cover = <span className={`${b}__cover`} />
  const inner = header !== 'row' ? content
    : href !== undefined ? <a className={`${b}__action`} href={href} aria-current={selected || undefined}>{content}{cover}</a>
    : onSelect ? <button type="button" className={`${b}__action`} aria-pressed={selected} onClick={onSelect}>{content}{cover}</button>
    : content
  if (header) return <th scope={header === 'row' ? 'row' : 'col'} className={cls} {...rest}>{inner}</th>
  return <td className={cls} {...rest}>{inner}</td>
}

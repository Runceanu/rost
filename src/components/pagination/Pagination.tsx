import type { HTMLAttributes } from 'react'
import { IconButton } from '../icon-button/IconButton'
import { Icon } from '../icon/Icon'
import './pagination.css'

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** The page shown, from 1. */
  readonly page: number
  /** How many there are. */
  readonly pages: number
  /** Called with the page to show. */
  readonly onChange?: (page: number) => void
}

const b = 'rost-pagination'

/**
 * Back, where you are, forward. The buttons are disabled at either end.
 * Built from contracts/pagination.contract.yaml.
 */
export function Pagination({ page, pages, onChange, className, ...rest }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={[b, className].filter(Boolean).join(' ')} {...rest}>
      <IconButton className={`${b}__previous`} variant="secondary" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange?.(page - 1)} />
      <span className={`${b}__label`} aria-live="polite">Page {page} of {pages}</span>
      <IconButton className={`${b}__next`} variant="secondary" aria-label="Next page" disabled={page >= pages} icon={<Icon name="arrow-right" size="small" />} onClick={() => onChange?.(page + 1)} />
    </nav>
  )
}

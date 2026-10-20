import type { HTMLAttributes } from 'react'
import './divider.css'

/**
 * A 1px line, as wide as its container. Built from
 * contracts/divider.contract.yaml.
 */
export function Divider({ className, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={['rost-divider', className].filter(Boolean).join(' ')} {...rest} />
}

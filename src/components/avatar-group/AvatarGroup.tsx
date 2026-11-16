import type { HTMLAttributes } from 'react'
import { Avatar } from '../avatar/Avatar'
import './avatar-group.css'

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Who, in order. */
  readonly people: readonly { readonly name: string; readonly src?: string }[]
  /** How many to show before the rest become +N. */
  readonly max?: number
}

const b = 'rost-avatar-group'

/** Who is involved, without a list. Built from contracts/avatar-group.contract.yaml. */
export function AvatarGroup({ people, max = 3, className, ...rest }: AvatarGroupProps) {
  const shown = people.slice(0, max)
  const more = people.length - shown.length
  return (
    <div role="group" aria-label={people.map((p) => p.name).join(', ')} className={[b, className].filter(Boolean).join(' ')} {...rest}>
      {shown.map((p, i) => <Avatar key={i} className={`${b}__avatar`} name={p.name} src={p.src} decorative />)}
      {more > 0 && <span className={`${b}__more`} aria-hidden="true">+{more}</span>}
    </div>
  )
}

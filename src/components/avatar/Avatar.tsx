import type { HTMLAttributes } from 'react'
import './avatar.css'

export type AvatarSize = 'small' | 'medium' | 'large'

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Who it is. The initials come from it, and it's what a screen reader says. */
  readonly name: string
  /** The photo. Without it, the initials. */
  readonly src?: string
  readonly size?: AvatarSize
  /** The name is written right beside it, so screen readers skip this. */
  readonly decorative?: boolean
}

const b = 'rost-avatar'

/** "Client One" -> "CO", "accounting" -> "A". */
export const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()

/**
 * A person or a client as a circle: their photo, or their initials on grey.
 * Built from contracts/avatar.contract.yaml.
 */
export function Avatar({ name, src, size = 'medium', decorative = false, className, ...rest }: AvatarProps) {
  const cls = [b, `${b}--size-${size}`, className].filter(Boolean).join(' ')
  const a11y = decorative ? { 'aria-hidden': true } : src ? {} : { role: 'img', 'aria-label': name }
  return (
    <span className={cls} {...a11y} {...rest}>
      {src
        ? <img className={`${b}__image`} src={src} alt={decorative ? '' : name} />
        : <span className={`${b}__initials`} aria-hidden="true">{initialsOf(name)}</span>}
    </span>
  )
}

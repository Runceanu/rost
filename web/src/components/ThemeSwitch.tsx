import { IconButton } from '../../../src/components/icon-button/IconButton'

/**
 * The light and dark switch in the header: Rost's tertiary IconButton with a
 * half-filled circle. Base.astro's script flips the theme and keeps the label
 * saying what a click will do.
 */
export function ThemeSwitch() {
  return (
    <IconButton
      variant="tertiary"
      className="theme-switch"
      aria-label="Switch to the light theme"
      data-theme-switch=""
      icon={
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 4.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
        </svg>
      }
    />
  )
}

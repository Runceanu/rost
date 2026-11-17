import { useRef, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from 'react'
import './slider.css'

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Between `min` and `max`. */
  readonly value: number
  readonly min?: number
  readonly max?: number
  /** What one arrow press moves it by. */
  readonly step?: number
  /** What it sets. The thumb's name for screen readers. */
  readonly label: string
  /** The value in words, like "30%". */
  readonly valueText?: string
  readonly disabled?: boolean
  readonly onValueChange?: (value: number) => void
}

const b = 'rost-slider'
const THUMB = 'var(--spacing-size-xsmall)'

/**
 * A number picked by dragging. The thumb is the `role="slider"`; the arrow
 * keys, Page Up and Down, Home and End move it. Built from
 * contracts/slider.contract.yaml.
 */
export function Slider({ value, min = 0, max = 100, step = 1, label, valueText, disabled = false, onValueChange, className, ...rest }: SliderProps) {
  const root = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLSpanElement>(null)
  const span = max - min || 1
  const share = Math.min(Math.max((value - min) / span, 0), 1)
  const snap = (v: number) => {
    const s = Math.round((v - min) / step) * step + min
    return Math.min(Math.max(Number(s.toFixed(10)), min), max)
  }
  const set = (v: number) => { const n = snap(v); if (n !== value) onValueChange?.(n) }
  const at = (e: PointerEvent) => {
    const r = root.current!.getBoundingClientRect()
    const t = thumb.current!.offsetWidth
    return min + Math.min(Math.max((e.clientX - r.left - t / 2) / (r.width - t || 1), 0), 1) * span
  }
  const key = (e: KeyboardEvent) => {
    if (disabled) return
    const to = { ArrowRight: value + step, ArrowUp: value + step, ArrowLeft: value - step, ArrowDown: value - step, PageUp: value + step * 10, PageDown: value - step * 10, Home: min, End: max }[e.key]
    if (to === undefined) return
    e.preventDefault()
    set(to)
  }
  return (
    <div
      ref={root}
      className={[b, className].filter(Boolean).join(' ')}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        thumb.current!.focus()
        set(at(e))
      }}
      onPointerMove={(e) => { if (!disabled && e.currentTarget.hasPointerCapture(e.pointerId)) set(at(e)) }}
      {...rest}
    >
      <span className={`${b}__track`} />
      <span className={`${b}__fill`} style={{ width: `calc(${share} * (100% - ${THUMB}) + ${THUMB} / 2)` }} />
      <span
        ref={thumb}
        className={`${b}__thumb`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        aria-orientation="horizontal"
        style={{ left: `calc(${share} * (100% - ${THUMB}))` }}
        onKeyDown={key}
      >
        <span className={`${b}__focus-ring`} />
      </span>
    </div>
  )
}

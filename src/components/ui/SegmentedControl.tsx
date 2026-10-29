import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface Option<T extends string> {
  value: T
  label: ReactNode
  /** Accessible name when the label is an icon. */
  ariaLabel?: string
  /** Hover hint; defaults to ariaLabel. */
  title?: string
  lang?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.ariaLabel}
            title={option.title ?? option.ariaLabel}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors [&_svg]:size-4',
              size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm',
              active ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-r from-accent-from to-accent-to text-accent-fg shadow-card hover:brightness-110 active:brightness-95',
  secondary: 'border border-border bg-surface text-fg shadow-card hover:bg-surface-muted',
  ghost: 'text-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-down text-white shadow-card hover:brightness-110 dark:text-bg',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
}

export function buttonStyles({
  variant = 'secondary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}

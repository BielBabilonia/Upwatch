import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-surface shadow-card', className)}
      {...props}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  id?: string
}

export function CardHeader({ title, description, actions, id }: CardHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold text-fg">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  )
}

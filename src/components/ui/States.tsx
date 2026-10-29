import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import { AlertIcon } from './icons'

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-surface-muted text-muted [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const { t } = useI18n()
  return (
    <div role="alert">
      <EmptyState
        className={className}
        icon={<AlertIcon className="text-down" />}
        title={t('common.errorTitle')}
        description={t('common.errorBody')}
        action={onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
      />
    </div>
  )
}

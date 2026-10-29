import type { MonitorStatus } from '../../api/schemas'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'

const dotColor: Record<MonitorStatus, string> = {
  up: 'bg-up',
  degraded: 'bg-degraded',
  down: 'bg-down',
  paused: 'bg-paused',
}

const badgeColor: Record<MonitorStatus, string> = {
  up: 'bg-up-soft text-up-fg',
  degraded: 'bg-degraded-soft text-degraded-fg',
  down: 'bg-down-soft text-down-fg',
  paused: 'bg-paused-soft text-paused-fg',
}

/** Colored dot; pulses while down so outages catch the eye. Decorative — pair with a label. */
export function StatusDot({ status, className }: { status: MonitorStatus; className?: string }) {
  return (
    <span aria-hidden className={cn('relative inline-flex size-2.5 shrink-0', className)}>
      {status === 'down' && (
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-down" />
      )}
      <span className={cn('relative inline-flex size-full rounded-full', dotColor[status])} />
    </span>
  )
}

export function StatusBadge({ status, className }: { status: MonitorStatus; className?: string }) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeColor[status],
        className,
      )}
    >
      <StatusDot status={status} className="size-2" />
      {t(`status.${status}`)}
    </span>
  )
}

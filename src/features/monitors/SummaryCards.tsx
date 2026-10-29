import type { Monitor } from '../../api/schemas'
import { StatTile, StatTileSkeleton } from '../../components/ui/StatTile'
import { useI18n } from '../../i18n/i18n-context'
import { formatPercent } from '../../lib/format'
import { StatusDot } from './StatusBadge'

export function SummaryCards({ monitors }: { monitors: readonly Monitor[] }) {
  const { t, locale } = useI18n()
  const count = (status: Monitor['status']) => monitors.filter((m) => m.status === status).length
  const uptimes = monitors.flatMap((m) => (m.paused || m.uptime24h === null ? [] : [m.uptime24h]))
  const avgUptime = uptimes.length ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length : null

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatTile
        label={t('monitors.summary.total')}
        value={monitors.length}
        hint={t('monitors.summary.totalHint', { active: monitors.length - count('paused') })}
      />
      <StatTile
        label={t('monitors.summary.up')}
        marker={<StatusDot status="up" />}
        value={count('up')}
        hint={t('monitors.summary.upHint')}
      />
      <StatTile
        label={t('monitors.summary.down')}
        marker={<StatusDot status="down" />}
        value={count('down')}
        hint={t('monitors.summary.downHint', { degraded: count('degraded') })}
      />
      <StatTile
        label={t('monitors.summary.uptime')}
        value={formatPercent(avgUptime, locale)}
        hint={t('monitors.summary.uptimeHint')}
      />
    </div>
  )
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  )
}

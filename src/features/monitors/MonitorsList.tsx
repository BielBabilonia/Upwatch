import { Link, useNavigate } from 'react-router-dom'
import type { Monitor } from '../../api/schemas'
import { ChevronRightIcon } from '../../components/ui/icons'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'
import { RelativeTime } from '../../components/ui/RelativeTime'
import { formatInterval, formatLatency, formatPercent, hostOf } from '../../lib/format'
import { StatusBadge, StatusDot } from './StatusBadge'

function uptimeTone(uptime: number | null) {
  if (uptime === null) return 'text-muted'
  if (uptime < 95) return 'text-down-fg'
  if (uptime < 99) return 'text-degraded-fg'
  return 'text-fg'
}

/** Desktop table and mobile cards render the same data; CSS picks one. */
export function MonitorsList({ monitors }: { monitors: readonly Monitor[] }) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const lastCheck = (m: Monitor) =>
    m.lastCheckedAt ? <RelativeTime date={m.lastCheckedAt} /> : t('monitors.never')

  return (
    <>
      <table className="hidden w-full text-sm md:table" aria-label={t('monitors.listLabel')}>
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium tracking-wide text-muted uppercase">
            <th scope="col" className="py-3 pr-4 pl-5 font-medium">{t('monitors.col.name')}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t('monitors.col.status')}</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">{t('monitors.col.uptime')}</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">{t('monitors.col.latency')}</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">{t('monitors.col.lastCheck')}</th>
            <td className="w-10 pr-5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {monitors.map((m) => (
            // Whole row is clickable for mouse users; the name stays the real link for keyboard and AT.
            <tr
              key={m.id}
              onClick={() => navigate(`/monitors/${m.id}`)}
              className="group cursor-pointer transition-colors hover:bg-surface-muted/60"
            >
              <td className="py-3.5 pr-4 pl-5">
                <Link
                  to={`/monitors/${m.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-sm font-medium text-fg"
                >
                  {m.name}
                </Link>
                <p className="mt-0.5 max-w-xs truncate text-xs text-muted">
                  {hostOf(m.url)} · {t('monitors.every', { interval: formatInterval(m.intervalSec) })}
                </p>
              </td>
              <td className="px-4 py-3.5"><StatusBadge status={m.status} /></td>
              <td className={cn('px-4 py-3.5 text-right font-medium tabular-nums', uptimeTone(m.uptime24h))}>
                {formatPercent(m.uptime24h, locale)}
              </td>
              <td className="px-4 py-3.5 text-right text-fg tabular-nums">{formatLatency(m.avgLatency24h, locale)}</td>
              <td className="px-4 py-3.5 text-right text-muted tabular-nums">{lastCheck(m)}</td>
              <td aria-hidden className="pr-5 text-subtle group-hover:text-fg">
                <ChevronRightIcon className="size-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden" aria-label={t('monitors.listLabel')}>
        {monitors.map((m) => (
          <li key={m.id}>
            <Link
              to={`/monitors/${m.id}`}
              className="flex items-center gap-3 px-4 py-4 focus-visible:-outline-offset-2 active:bg-surface-muted"
            >
              <StatusDot status={m.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-fg">{m.name}</p>
                  <span className={cn('text-sm font-medium tabular-nums', uptimeTone(m.uptime24h))}>
                    {formatPercent(m.uptime24h, locale)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{hostOf(m.url)}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className="font-medium text-fg">{t(`status.${m.status}`)}</span>
                  <span aria-hidden>·</span>
                  <span>{formatLatency(m.avgLatency24h, locale)}</span>
                  <span aria-hidden>·</span>
                  <span>{lastCheck(m)}</span>
                </p>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-subtle" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function MonitorsListSkeleton() {
  return (
    <div className="divide-y divide-border" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-2.5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="hidden h-4 w-14 md:block" />
        </div>
      ))}
    </div>
  )
}

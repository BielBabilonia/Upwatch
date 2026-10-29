import { Link } from 'react-router-dom'
import { useIncidents, useMonitorDetails, useMonitors } from '../../api/queries'
import type { Monitor } from '../../api/schemas'
import { LanguageToggle, ThemeToggle } from '../../components/layout/Preferences'
import { Card } from '../../components/ui/Card'
import { AlertIcon, CheckIcon, LogoMark } from '../../components/ui/icons'
import { RelativeTime } from '../../components/ui/RelativeTime'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'
import { formatDateTime, formatPercent, formatTime } from '../../lib/format'
import { RANGE_MS } from '../../lib/ranges'
import { bucketUptime, overallStatus, type OverallStatus } from '../../lib/status'
import { useDocumentTitle } from '../../lib/use-document-title'
import { IncidentList, IncidentListSkeleton } from '../incidents/IncidentList'
import { StatusDot } from '../monitors/StatusBadge'
import { UptimeBar, UptimeLegend } from '../monitors/UptimeBar'

const BUCKETS = 84

const bannerStyle: Record<OverallStatus, string> = {
  operational: 'border-up/40 bg-up-soft text-up-fg',
  degraded: 'border-degraded/50 bg-degraded-soft text-degraded-fg',
  partial: 'border-degraded/50 bg-degraded-soft text-degraded-fg',
  major: 'border-down/40 bg-down-soft text-down-fg',
  unknown: 'border-border bg-paused-soft text-paused-fg',
}

function Banner({ monitors, updatedAt }: { monitors: readonly Monitor[]; updatedAt: number }) {
  const { t } = useI18n()
  const status = overallStatus(monitors)
  return (
    <div
      role="status"
      className={cn('flex items-center gap-3 rounded-xl border px-5 py-4', bannerStyle[status])}
    >
      {status === 'operational' ? (
        <CheckIcon className="size-6 shrink-0" />
      ) : (
        <AlertIcon className="size-6 shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-lg font-semibold">{t(`statusPage.${status}`)}</p>
        <p className="text-sm">
          {t('statusPage.updated')} <RelativeTime date={updatedAt} />
        </p>
      </div>
    </div>
  )
}

function ServiceRow({ monitor, detail }: { monitor: Monitor; detail: ReturnType<typeof useMonitorDetails>[number] }) {
  const { t, locale } = useI18n()
  // Only read when detail.data exists, so dataUpdatedAt is set.
  const to = detail.dataUpdatedAt
  const from = to - RANGE_MS['7d']
  return (
    <li className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="truncate font-medium text-fg">{monitor.name}</p>
        <p className="flex shrink-0 items-center gap-2 text-sm text-muted">
          {detail.data && (
            <span className="hidden sm:inline">
              {t('statusPage.uptime7d', { uptime: formatPercent(detail.data.uptime, locale) })}
              <span aria-hidden className="mx-2">·</span>
            </span>
          )}
          <StatusDot status={monitor.status} />
          <span className="font-medium text-fg">{t(`status.${monitor.status}`)}</span>
        </p>
      </div>
      {detail.data ? (
        <UptimeBar
          buckets={bucketUptime(detail.data.checks, from, to, BUCKETS)}
          label={`${monitor.name}: ${t('statusPage.uptime7d', { uptime: formatPercent(detail.data.uptime, locale) })}`}
          describeBucket={(b) => `${formatDateTime(b.start, locale)} – ${formatTime(b.end, locale)}`}
          startLabel={t('statusPage.daysAgo')}
          endLabel={t('statusPage.today')}
        />
      ) : (
        <>
          <Skeleton className="h-8 w-full" />
          <div className="mt-2 h-4" />
        </>
      )}
    </li>
  )
}

export function StatusPage() {
  const { t } = useI18n()
  const monitors = useMonitors()
  const details = useMonitorDetails(monitors.data?.map((m) => m.id) ?? [], '7d')
  const incidents = useIncidents()
  useDocumentTitle(t('statusPage.title'))

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-9" />
            <div>
              <h1 className="text-lg leading-tight font-semibold">{t('statusPage.title')}</h1>
              <p className="text-sm text-muted">{t('statusPage.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        {monitors.data ? (
          <>
            <Banner monitors={monitors.data} updatedAt={monitors.dataUpdatedAt} />
            <section aria-labelledby="services-title">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="services-title" className="font-semibold">
                  {t('statusPage.services')}
                </h2>
                <UptimeLegend />
              </div>
              <Card>
                <ul className="divide-y divide-border">
                  {monitors.data.map((monitor, index) => (
                    <ServiceRow key={monitor.id} monitor={monitor} detail={details[index]} />
                  ))}
                </ul>
              </Card>
            </section>
          </>
        ) : monitors.isError ? (
          <ErrorState onRetry={() => monitors.refetch()} />
        ) : (
          <div className="space-y-8" aria-busy>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        )}

        <section aria-labelledby="incidents-title">
          <h2 id="incidents-title" className="mb-3 font-semibold">
            {t('statusPage.incidents')}
          </h2>
          <Card className="p-5">
            {incidents.data ? (
              <IncidentList incidents={incidents.data.slice(0, 10)} showMonitor />
            ) : incidents.isError ? (
              <ErrorState onRetry={() => incidents.refetch()} />
            ) : (
              <IncidentListSkeleton />
            )}
          </Card>
        </section>
      </main>

      <footer className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pb-10 text-sm text-muted sm:px-6">
        <p className="flex items-center gap-1.5">
          {t('statusPage.poweredBy')}
          <LogoMark className="size-4" />
          <span className="font-medium text-fg">Upwatch</span>
        </p>
        <Link to="/" className="rounded-sm font-medium hover:text-fg">
          {t('statusPage.openDashboard')} →
        </Link>
      </footer>
    </div>
  )
}

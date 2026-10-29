import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { useIncidents, useMonitor, useUpdateMonitor } from '../../api/queries'
import { rangeSchema, type MonitorDetail, type Range } from '../../api/schemas'
import { Button } from '../../components/ui/Button'
import { buttonStyles } from '../../components/ui/button-styles'
import { Card, CardHeader } from '../../components/ui/Card'
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from '../../components/ui/icons'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton } from '../../components/ui/Skeleton'
import { StatTile, StatTileSkeleton } from '../../components/ui/StatTile'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { RelativeTime } from '../../components/ui/RelativeTime'
import { useToast } from '../../components/ui/toast-context'
import { useI18n } from '../../i18n/i18n-context'
import {
  formatDateTime,
  formatInterval,
  formatLatency,
  formatPercent,
  formatTime,
} from '../../lib/format'
import { RANGE_MS } from '../../lib/ranges'
import { bucketUptime } from '../../lib/status'
import { useDocumentTitle } from '../../lib/use-document-title'
import { IncidentList, IncidentListSkeleton } from '../incidents/IncidentList'
import { DeleteMonitorDialog } from './DeleteMonitorDialog'
import { MonitorFormModal } from './MonitorFormModal'
import { StatusBadge, StatusDot } from './StatusBadge'
import { UptimeBar, UptimeLegend } from './UptimeBar'

const BUCKETS: Record<Range, number> = { '24h': 24, '7d': 84 }

// Recharts is the heaviest dependency. Start downloading it with this route (in parallel
// with the data request) but don't block the header and stats on it.
const chartModule = import('./LatencyChart')
const LatencyChart = lazy(async () => ({ default: (await chartModule).LatencyChart }))
const ChecksTable = lazy(async () => ({ default: (await chartModule).ChecksTable }))

export function MonitorDetailPage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedRange = rangeSchema.safeParse(searchParams.get('range'))
  const range: Range = parsedRange.success ? parsedRange.data : '24h'
  const { data: monitor, error, isError, refetch, dataUpdatedAt } = useMonitor(id, range)
  useDocumentTitle(monitor?.name)

  const setRange = (next: Range) =>
    setSearchParams(next === '24h' ? {} : { range: next }, { replace: true })

  if (!monitor) {
    if (error instanceof ApiError && error.isNotFound) {
      return (
        <EmptyState
          className="py-24"
          title={t('detail.notFoundTitle')}
          description={t('detail.notFoundBody')}
          action={
            <Link to="/" className={buttonStyles({ variant: 'primary' })}>
              {t('common.backHome')}
            </Link>
          }
        />
      )
    }
    if (isError) return <ErrorState className="py-24" onRetry={() => refetch()} />
    return <DetailSkeleton />
  }

  return <MonitorDetailView monitor={monitor} range={range} onRangeChange={setRange} to={dataUpdatedAt} />
}

interface MonitorDetailViewProps {
  monitor: MonitorDetail
  range: Range
  onRangeChange: (range: Range) => void
  /** Time the data was fetched; the right edge of every chart. */
  to: number
}

function MonitorDetailView({ monitor, range, onRangeChange, to }: MonitorDetailViewProps) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const update = useUpdateMonitor()
  const incidents = useIncidents(monitor.id)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // While switching ranges the previous range's data is shown as a placeholder.
  const shownRange = monitor.range
  const from = to - RANGE_MS[shownRange]
  const buckets = bucketUptime(monitor.checks, from, to, BUCKETS[shownRange])
  const incidentsInRange = incidents.data?.filter(
    (i) => i.resolvedAt === null || Date.parse(i.startedAt) >= from,
  )

  function togglePaused() {
    const paused = !monitor.paused
    update.mutate(
      { id: monitor.id, patch: { paused } },
      {
        onSuccess: (saved) => toast(t(paused ? 'toast.paused' : 'toast.resumed', { name: saved.name })),
        onError: (error) => toast(t('toast.error', { message: error.message }), 'error'),
      },
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowLeftIcon className="size-4" />
        {t('detail.back')}
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusDot status={monitor.status} className="size-3" />
            <h1 className="truncate text-2xl font-semibold tracking-tight">{monitor.name}</h1>
            <StatusBadge status={monitor.status} />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <a
              href={monitor.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-1 rounded-sm break-all hover:text-fg"
            >
              {monitor.url}
              <ExternalLinkIcon className="size-3.5 shrink-0" />
            </a>
            <span aria-hidden>·</span>
            <span>{t('detail.checkedEvery', { interval: formatInterval(monitor.intervalSec) })}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditing(true)}>
            <PencilIcon />
            {t('detail.edit')}
          </Button>
          <Button onClick={togglePaused} disabled={update.isPending}>
            {monitor.paused ? <PlayIcon /> : <PauseIcon />}
            {monitor.paused ? t('detail.resume') : t('detail.pause')}
          </Button>
          <Button variant="ghost" onClick={() => setDeleting(true)} className="hover:text-down-fg">
            <TrashIcon />
            {t('detail.delete')}
          </Button>
        </div>
      </header>

      {monitor.paused && (
        <p className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
          {t('detail.pausedNotice')}
        </p>
      )}

      <div className="flex justify-end">
        <SegmentedControl<Range>
          label={t('detail.range')}
          value={range}
          onChange={onRangeChange}
          options={rangeSchema.options.map((value) => ({ value, label: t(`detail.range.${value}`) }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label={t('detail.stat.uptime')}
          value={formatPercent(monitor.uptime, locale)}
          hint={t(`detail.range.${shownRange}`)}
        />
        <StatTile
          label={t('detail.stat.latency')}
          value={formatLatency(monitor.avgLatency, locale)}
          hint={t(`detail.range.${shownRange}`)}
        />
        <StatTile
          label={t('detail.stat.lastCheck')}
          value={
            <span className="text-xl sm:text-2xl">
              {monitor.lastCheckedAt ? <RelativeTime date={monitor.lastCheckedAt} /> : t('monitors.never')}
            </span>
          }
          hint={monitor.lastCheckedAt ? formatDateTime(monitor.lastCheckedAt, locale) : undefined}
        />
        <StatTile
          label={t('detail.stat.incidents')}
          value={incidentsInRange?.length ?? '—'}
          hint={t('detail.stat.incidentsHint')}
        />
      </div>

      <Card aria-labelledby="latency-title">
        <CardHeader id="latency-title" title={t('detail.latencyTitle')} />
        <div className="px-2 pt-4 pb-5 sm:px-5">
          {monitor.checks.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t('detail.noChecks')}</p>
          ) : (
            <Suspense fallback={<Skeleton className="h-64 w-full sm:h-72" />}>
              <LatencyChart
                checks={monitor.checks}
                range={shownRange}
                from={from}
                to={to}
                avgLatency={monitor.avgLatency}
              />
              <ChecksTable checks={monitor.checks} />
            </Suspense>
          )}
        </div>
      </Card>

      <Card aria-labelledby="uptime-title">
        <CardHeader
          id="uptime-title"
          title={t('detail.uptimeTitle')}
          description={shownRange === '24h' ? t('detail.uptimeHourly') : t('detail.uptimeTwoHours')}
          actions={<UptimeLegend />}
        />
        <div className="px-5 pt-4 pb-5">
          <UptimeBar
            buckets={buckets}
            label={`${t('detail.uptimeTitle')}: ${formatPercent(monitor.uptime, locale)}`}
            describeBucket={(b) => `${formatDateTime(b.start, locale)} – ${formatTime(b.end, locale)}`}
            startLabel={t('uptime.ago', { label: t(`detail.range.${shownRange}`) })}
            endLabel={t('uptime.now')}
          />
        </div>
      </Card>

      <Card aria-labelledby="incidents-title">
        <CardHeader id="incidents-title" title={t('detail.incidentsTitle')} />
        <div className="p-5">
          {incidentsInRange ? (
            <IncidentList incidents={incidentsInRange} />
          ) : incidents.isError ? (
            <ErrorState onRetry={() => incidents.refetch()} />
          ) : (
            <IncidentListSkeleton />
          )}
        </div>
      </Card>

      <MonitorFormModal open={editing} onClose={() => setEditing(false)} monitor={monitor} />
      <DeleteMonitorDialog
        monitor={monitor}
        open={deleting}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate('/', { replace: true })}
      />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}

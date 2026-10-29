import { Link } from 'react-router-dom'
import type { Incident } from '../../api/schemas'
import { CheckIcon } from '../../components/ui/icons'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/States'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'
import { formatDateTime, formatDuration } from '../../lib/format'
import { useNow } from '../../lib/use-now'

interface IncidentListProps {
  incidents: readonly Incident[]
  /** Show which monitor each incident belongs to (and link to it). */
  showMonitor?: boolean
  linkMonitor?: boolean
}

/** Vertical timeline of incidents, newest first. */
export function IncidentList({ incidents, showMonitor = false, linkMonitor = false }: IncidentListProps) {
  const { t, locale } = useI18n()
  const now = useNow(10_000)

  if (incidents.length === 0) {
    return (
      <EmptyState
        className="py-8"
        icon={<CheckIcon className="text-up" />}
        title={t('incidents.emptyTitle')}
        description={t('incidents.emptyBody')}
      />
    )
  }

  return (
    <ol className="relative">
      {incidents.map((incident, index) => {
        const ongoing = incident.resolvedAt === null
        const end = ongoing ? now : Date.parse(incident.resolvedAt!)
        const duration = formatDuration(end - Date.parse(incident.startedAt))
        return (
          <li key={incident.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < incidents.length - 1 && (
              <span aria-hidden className="absolute top-5 bottom-0 left-[7px] w-px bg-border" />
            )}
            <span
              aria-hidden
              className={cn(
                'relative mt-1 size-[15px] shrink-0 rounded-full border-[3px] border-surface ring-1',
                ongoing ? 'bg-down ring-down' : 'bg-up ring-up/50',
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-medium text-fg">{incident.cause}</p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    ongoing ? 'bg-down-soft text-down-fg' : 'bg-up-soft text-up-fg',
                  )}
                >
                  {ongoing ? t('incidents.ongoing') : t('incidents.resolved')}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {showMonitor &&
                  (linkMonitor ? (
                    <>
                      <Link to={`/monitors/${incident.monitorId}`} className="font-medium text-fg hover:underline">
                        {incident.monitorName}
                      </Link>
                      {' · '}
                    </>
                  ) : (
                    <span className="font-medium text-fg">{incident.monitorName} · </span>
                  ))}
                <time dateTime={incident.startedAt}>{formatDateTime(incident.startedAt, locale)}</time>
                {' · '}
                {ongoing ? t('incidents.ongoingFor', { duration }) : t('incidents.duration', { duration })}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function IncidentListSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      ))}
    </div>
  )
}

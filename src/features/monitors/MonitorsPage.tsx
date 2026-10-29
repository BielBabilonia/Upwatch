import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMonitors } from '../../api/queries'
import { monitorStatusSchema, type MonitorStatus } from '../../api/schemas'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Field'
import { ActivityIcon, PlusIcon, SearchIcon } from '../../components/ui/icons'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { useI18n } from '../../i18n/i18n-context'
import { useDocumentTitle } from '../../lib/use-document-title'
import { MonitorFormModal } from './MonitorFormModal'
import { MonitorsList, MonitorsListSkeleton } from './MonitorsList'
import { SummaryCards, SummaryCardsSkeleton } from './SummaryCards'

type Filter = MonitorStatus | 'all'

export function MonitorsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: monitors, isError, refetch } = useMonitors()
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  useDocumentTitle(t('monitors.title'))

  const normalized = query.trim().toLowerCase()
  const visible = (monitors ?? []).filter(
    (m) =>
      (filter === 'all' || m.status === filter) &&
      (!normalized || m.name.toLowerCase().includes(normalized) || m.url.toLowerCase().includes(normalized)),
  )

  const newButton = (
    <Button variant="primary" onClick={() => setCreating(true)}>
      <PlusIcon />
      {t('monitors.new')}
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('monitors.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('monitors.subtitle')}</p>
        </div>
        {newButton}
      </div>

      {monitors ? <SummaryCards monitors={monitors} /> : !isError && <SummaryCardsSkeleton />}

      <Card>
        {monitors && monitors.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative sm:w-72">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                aria-label={t('monitors.search')}
                placeholder={t('monitors.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="-mx-1 overflow-x-auto px-1">
              <SegmentedControl<Filter>
                label={t('monitors.filter')}
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: t('monitors.filterAll') },
                  ...monitorStatusSchema.options.map((status) => ({
                    value: status,
                    label: t(`status.${status}`),
                  })),
                ]}
              />
            </div>
          </div>
        )}

        {/* Prefer stale data over an error screen when a background refetch fails. */}
        {!monitors ? (
          isError ? <ErrorState onRetry={() => refetch()} /> : <MonitorsListSkeleton />
        ) : monitors.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon />}
            title={t('monitors.emptyTitle')}
            description={t('monitors.emptyBody')}
            action={newButton}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title={t('monitors.noResultsTitle')}
            description={t('monitors.noResultsBody')}
            action={
              <Button
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
              >
                {t('monitors.clearFilters')}
              </Button>
            }
          />
        ) : (
          <MonitorsList monitors={visible} />
        )}
      </Card>

      <MonitorFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(monitor) => navigate(`/monitors/${monitor.id}`)}
      />
    </div>
  )
}

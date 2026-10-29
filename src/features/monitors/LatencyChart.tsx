import { memo, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { Check, Range } from '../../api/schemas'
import { useI18n } from '../../i18n/i18n-context'
import { formatDateTime, formatDay, formatLatency, formatTime } from '../../lib/format'
import { DEGRADED_LATENCY_MS } from '../../lib/status'

interface ChartPoint {
  t: number
  latency: number | null
  /** Plotted on the baseline for failed checks. */
  failed: number | null
  check: Check
}

interface LatencyChartProps {
  checks: readonly Check[]
  range: Range
  from: number
  to: number
  avgLatency: number | null
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const { t, locale } = useI18n()
  const point = payload?.[0]?.payload as ChartPoint | undefined
  if (!active || !point) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-overlay">
      <p className="text-muted">{formatDateTime(point.t, locale)}</p>
      {point.check.ok ? (
        <p className="mt-1 flex items-center gap-2 font-medium text-fg">
          <span aria-hidden className="h-0.5 w-3 rounded-full bg-linear-to-r from-accent-from to-accent-to" />
          {formatLatency(point.latency, locale)}
        </p>
      ) : (
        <p className="mt-1 flex items-center gap-2 font-medium text-fg">
          <span aria-hidden className="size-2 rounded-full bg-down" />
          {point.check.statusCode
            ? t('detail.result.failed', { code: point.check.statusCode })
            : t('detail.result.timeout')}
        </p>
      )}
    </div>
  )
}

// Memoized: polling re-renders the page, but the chart only changes when its data does.
export const LatencyChart = memo(function LatencyChart({
  checks,
  range,
  from,
  to,
  avgLatency,
}: LatencyChartProps) {
  const { t, locale } = useI18n()

  const data = useMemo<ChartPoint[]>(
    () =>
      checks.map((check) => ({
        t: Date.parse(check.at),
        latency: check.ok ? check.latencyMs : null,
        failed: check.ok ? null : 0,
        check,
      })),
    [checks],
  )
  const maxLatency = Math.max(0, ...data.map((p) => p.latency ?? 0))
  // Only draw the threshold when it's within reach; otherwise it squashes healthy charts.
  const showThreshold = maxLatency > DEGRADED_LATENCY_MS * 0.7
  // Scatter gets only the failures: null y values would be drawn at the top edge.
  const failures = data.filter((p) => p.failed !== null)
  const hasFailures = failures.length > 0

  return (
    <figure>
      <div
        className="h-64 w-full sm:h-72"
        role="img"
        aria-label={t('detail.chartLabel', { count: data.length, avg: formatLatency(avgLatency, locale) })}
      >
        <ComposedChart
          responsive
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="latency-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="latency-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent-from)" />
              <stop offset="100%" stopColor="var(--accent-to)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[from, to]}
            tickFormatter={(value: number) =>
              range === '24h' ? formatTime(value, locale) : formatDay(value, locale)
            }
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={32}
          />
          <YAxis
            width={56}
            tickFormatter={(value: number) => formatLatency(value, locale)}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          {showThreshold && (
            <ReferenceLine
              y={DEGRADED_LATENCY_MS}
              stroke="var(--degraded)"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />
          )}
          <Tooltip
            content={(props) => <ChartTooltip {...props} />}
            cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke="url(#latency-stroke)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="url(#latency-fill)"
            connectNulls={false}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
          <Scatter
            data={failures}
            dataKey="failed"
            fill="var(--down)"
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive={false}
            shape={(props: { cx?: number; cy?: number }) => (
              <circle cx={props.cx} cy={props.cy} r={4.5} fill="var(--down)" stroke="var(--surface)" strokeWidth={2} />
            )}
          />
        </ComposedChart>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-3 rounded-full bg-linear-to-r from-accent-from to-accent-to" />
          {t('detail.latencyLegend')}
        </span>
        {hasFailures && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-down" />
            {t('detail.failedLegend')}
          </span>
        )}
        {showThreshold && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-px w-3 bg-degraded" />
            {t('detail.thresholdLegend')} ({formatLatency(DEGRADED_LATENCY_MS, locale)})
          </span>
        )}
      </figcaption>
    </figure>
  )
})

/** The chart's data as a table — the accessible alternative to the plot. */
export const ChecksTable = memo(function ChecksTable({ checks }: { checks: readonly Check[] }) {
  const { t, locale } = useI18n()
  // Rows are only rendered once opened: hundreds of hidden rows aren't free.
  const [open, setOpen] = useState(false)
  const rows = open ? [...checks].reverse() : []
  return (
    <details
      className="group mt-4 rounded-lg border border-border"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted select-none hover:text-fg">
        {t('detail.showData')}
      </summary>
      <div className="max-h-64 overflow-y-auto border-t border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">{t('detail.col.time')}</th>
              <th scope="col" className="px-3 py-2 font-medium">{t('detail.col.result')}</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{t('detail.col.latency')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {rows.map((check) => (
              <tr key={check.at}>
                <td className="px-3 py-1.5 text-muted">{formatDateTime(check.at, locale)}</td>
                <td className="px-3 py-1.5">
                  {check.ok
                    ? t('detail.result.ok')
                    : check.statusCode
                      ? t('detail.result.failed', { code: check.statusCode })
                      : t('detail.result.timeout')}
                </td>
                <td className="px-3 py-1.5 text-right">{formatLatency(check.latencyMs, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
})

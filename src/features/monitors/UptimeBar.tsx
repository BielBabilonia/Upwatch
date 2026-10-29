import { useState } from 'react'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'
import { formatPercent } from '../../lib/format'
import { uptimeLevel, type UptimeBucket, type UptimeLevel } from '../../lib/status'

const levelColor: Record<UptimeLevel, string> = {
  ok: 'bg-up',
  minor: 'bg-degraded',
  major: 'bg-down',
  none: 'bg-empty',
}

interface UptimeBarProps {
  buckets: readonly UptimeBucket[]
  /** Text for a bucket's time span, e.g. "Oct 28, 14:00 – 15:00". */
  describeBucket: (bucket: UptimeBucket) => string
  /** Accessible summary of the whole bar. */
  label: string
  startLabel: string
  endLabel: string
  className?: string
}

/** GitHub-style row of squares, one per time bucket, colored by uptime. */
export function UptimeBar({ buckets, describeBucket, label, startLabel, endLabel, className }: UptimeBarProps) {
  const { t, locale } = useI18n()
  // One shared tooltip instead of one per square keeps the DOM small (status page has ~500 squares).
  const [hovered, setHovered] = useState<number | null>(null)
  const active = hovered === null ? undefined : buckets[hovered]

  function describe(bucket: UptimeBucket) {
    const range = describeBucket(bucket)
    if (bucket.uptime === null) return `${range}: ${t('uptime.noData')}`
    const uptime = formatPercent(bucket.uptime, locale)
    return bucket.failed > 0
      ? t('uptime.bucketFailed', { range, uptime, failed: bucket.failed })
      : t('uptime.bucket', { range, uptime })
  }

  return (
    <div className={cn('relative', className)}>
      <div role="img" aria-label={label} className="flex h-8 gap-px sm:gap-0.5" onMouseLeave={() => setHovered(null)}>
        {buckets.map((bucket, index) => (
          <span
            key={bucket.start}
            onMouseEnter={() => setHovered(index)}
            className={cn(
              'h-full flex-1 rounded-[2px] transition-opacity sm:rounded-[3px]',
              levelColor[uptimeLevel(bucket.uptime)],
              hovered !== null && hovered !== index && 'opacity-60',
            )}
          />
        ))}
      </div>
      {active && hovered !== null && (
        <span
          aria-hidden
          // Anchor near the hovered square, clamped so edge tooltips stay inside the bar.
          style={{ left: `${Math.min(85, Math.max(15, ((hovered + 0.5) / buckets.length) * 100))}%` }}
          className="pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-64 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg shadow-overlay"
        >
          {describe(active)}
        </span>
      )}
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}

export function UptimeLegend() {
  const { t } = useI18n()
  const items: [UptimeLevel, string][] = [
    ['ok', t('uptime.legend.ok')],
    ['minor', t('uptime.legend.minor')],
    ['major', t('uptime.legend.major')],
    ['none', t('uptime.noData')],
  ]
  return (
    <ul aria-label={t('uptime.legendLabel')} className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map(([level, text]) => (
        <li key={level} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2.5 rounded-[2px]', levelColor[level])} />
          {text}
        </li>
      ))}
    </ul>
  )
}

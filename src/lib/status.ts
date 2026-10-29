import type { Check, Monitor, MonitorStatus } from '../api/schemas'

export const DEGRADED_LATENCY_MS = 1000

/** Status rules: paused > down (last check failed) > degraded (slow last check) > up. */
export function deriveStatus(paused: boolean, lastCheck: Check | undefined): MonitorStatus {
  if (paused) return 'paused'
  if (!lastCheck) return 'up'
  if (!lastCheck.ok) return 'down'
  if ((lastCheck.latencyMs ?? 0) > DEGRADED_LATENCY_MS) return 'degraded'
  return 'up'
}

/** Percentage of successful checks, or null when there are none. */
export function uptimeOf(checks: readonly Check[]): number | null {
  if (checks.length === 0) return null
  const ok = checks.filter((c) => c.ok).length
  return (ok / checks.length) * 100
}

/** Mean latency of successful checks, or null when there are none. */
export function avgLatencyOf(checks: readonly Check[]): number | null {
  const latencies = checks.flatMap((c) => (c.ok && c.latencyMs !== null ? [c.latencyMs] : []))
  if (latencies.length === 0) return null
  return latencies.reduce((sum, l) => sum + l, 0) / latencies.length
}

export type OverallStatus = 'operational' | 'degraded' | 'partial' | 'major' | 'unknown'

export function overallStatus(monitors: readonly Pick<Monitor, 'status'>[]): OverallStatus {
  const active = monitors.filter((m) => m.status !== 'paused')
  if (active.length === 0) return 'unknown'
  const down = active.filter((m) => m.status === 'down').length
  if (down === active.length) return 'major'
  if (down > 0) return 'partial'
  if (active.some((m) => m.status === 'degraded')) return 'degraded'
  return 'operational'
}

export interface UptimeBucket {
  start: number
  end: number
  /** Null when the bucket has no checks (monitor paused or not yet created). */
  uptime: number | null
  total: number
  failed: number
}

/** Splits [from, to) into `count` equal buckets and computes uptime for each. */
export function bucketUptime(
  checks: readonly Check[],
  from: number,
  to: number,
  count: number,
): UptimeBucket[] {
  const size = (to - from) / count
  const buckets: UptimeBucket[] = Array.from({ length: count }, (_, i) => ({
    start: from + i * size,
    end: from + (i + 1) * size,
    uptime: null,
    total: 0,
    failed: 0,
  }))
  for (const check of checks) {
    const t = Date.parse(check.at)
    if (t < from || t >= to) continue
    const bucket = buckets[Math.min(count - 1, Math.floor((t - from) / size))]
    bucket.total += 1
    if (!check.ok) bucket.failed += 1
  }
  for (const bucket of buckets) {
    if (bucket.total > 0) bucket.uptime = ((bucket.total - bucket.failed) / bucket.total) * 100
  }
  return buckets
}

export type UptimeLevel = 'ok' | 'minor' | 'major' | 'none'

/** Below this a bucket counts as a major outage rather than a blip. */
export const MINOR_OUTAGE_THRESHOLD = 95

export function uptimeLevel(uptime: number | null): UptimeLevel {
  if (uptime === null) return 'none'
  if (uptime >= 100) return 'ok'
  if (uptime >= MINOR_OUTAGE_THRESHOLD) return 'minor'
  return 'major'
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "99.98%" — keeps two decimals only when it matters, never rounds a failure up to 100%. */
export function formatPercent(value: number | null, locale: string): string {
  if (value === null) return '—'
  const truncated = Math.floor(value * 100) / 100
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: truncated === 100 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(truncated / 100)
}

export function formatLatency(ms: number | null, locale: string): string {
  if (ms === null) return '—'
  if (ms >= 1000) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(ms / 1000)} s`
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(ms)} ms`
}

/** Compact duration: "45s", "12m", "3h 5m", "2d 4h". */
export function formatDuration(ms: number): string {
  const abs = Math.max(0, ms)
  if (abs < MINUTE) return `${Math.round(abs / SECOND)}s`
  if (abs < HOUR) return `${Math.floor(abs / MINUTE)}m`
  if (abs < DAY) {
    const h = Math.floor(abs / HOUR)
    const m = Math.floor((abs % HOUR) / MINUTE)
    return m ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(abs / DAY)
  const h = Math.floor((abs % DAY) / HOUR)
  return h ? `${d}d ${h}h` : `${d}d`
}

/** "12 seconds ago", "in 3 minutes", localized. */
export function formatRelativeTime(date: string | number, locale: string, now = Date.now()): string {
  const diff = (typeof date === 'string' ? Date.parse(date) : date) - now
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (abs < 10 * SECOND) return rtf.format(0, 'second')
  if (abs < MINUTE) return rtf.format(Math.round(diff / SECOND), 'second')
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), 'minute')
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), 'hour')
  return rtf.format(Math.round(diff / DAY), 'day')
}

export function formatDateTime(date: string | number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatTime(date: string | number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function formatDay(date: string | number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(date))
}

/** "30s", "1m", "5m". */
export function formatInterval(seconds: number): string {
  return seconds < 60 ? `${seconds}s` : `${seconds / 60}m`
}

export function hostOf(url: string): string {
  try {
    const { host, pathname } = new URL(url)
    return pathname === '/' ? host : `${host}${pathname}`
  } catch {
    return url
  }
}

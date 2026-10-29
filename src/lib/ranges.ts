import type { Range } from '../api/schemas'

export const HOUR_MS = 60 * 60 * 1000
export const DAY_MS = 24 * HOUR_MS

export const RANGE_MS: Record<Range, number> = { '24h': DAY_MS, '7d': 7 * DAY_MS }

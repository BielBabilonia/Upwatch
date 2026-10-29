import { describe, expect, it } from 'vitest'
import type { Check } from '../api/schemas'
import { avgLatencyOf, bucketUptime, deriveStatus, overallStatus, uptimeLevel, uptimeOf } from './status'

const check = (overrides: Partial<Check> = {}): Check => ({
  at: '2026-01-01T00:00:00.000Z',
  ok: true,
  latencyMs: 200,
  statusCode: 200,
  ...overrides,
})

describe('deriveStatus', () => {
  it('ranks paused > down > degraded > up', () => {
    const failed = check({ ok: false, latencyMs: null, statusCode: 503 })
    const slow = check({ latencyMs: 1500 })
    expect(deriveStatus(true, failed)).toBe('paused')
    expect(deriveStatus(false, failed)).toBe('down')
    expect(deriveStatus(false, slow)).toBe('degraded')
    expect(deriveStatus(false, check())).toBe('up')
  })

  it('treats exactly 1000ms as healthy', () => {
    expect(deriveStatus(false, check({ latencyMs: 1000 }))).toBe('up')
  })

  it('is up before the first check', () => {
    expect(deriveStatus(false, undefined)).toBe('up')
  })
})

describe('uptimeOf / avgLatencyOf', () => {
  it('computes uptime and ignores failed checks for latency', () => {
    const checks = [check({ latencyMs: 100 }), check({ latencyMs: 300 }), check({ ok: false, latencyMs: null })]
    expect(uptimeOf(checks)).toBeCloseTo(66.67, 1)
    expect(avgLatencyOf(checks)).toBe(200)
  })

  it('returns null without data', () => {
    expect(uptimeOf([])).toBeNull()
    expect(avgLatencyOf([check({ ok: false, latencyMs: null })])).toBeNull()
  })
})

describe('overallStatus', () => {
  it('summarizes active monitors', () => {
    expect(overallStatus([{ status: 'up' }, { status: 'paused' }])).toBe('operational')
    expect(overallStatus([{ status: 'up' }, { status: 'degraded' }])).toBe('degraded')
    expect(overallStatus([{ status: 'up' }, { status: 'down' }])).toBe('partial')
    expect(overallStatus([{ status: 'down' }, { status: 'paused' }])).toBe('major')
    expect(overallStatus([{ status: 'paused' }])).toBe('unknown')
  })
})

describe('bucketUptime', () => {
  it('splits checks into equal buckets', () => {
    const from = Date.parse('2026-01-01T00:00:00Z')
    const at = (minutes: number) => new Date(from + minutes * 60_000).toISOString()
    const buckets = bucketUptime(
      [check({ at: at(10) }), check({ at: at(20), ok: false }), check({ at: at(70) })],
      from,
      from + 3 * 3_600_000,
      3,
    )
    expect(buckets.map((b) => b.uptime)).toEqual([50, 100, null])
    expect(buckets[0]).toMatchObject({ total: 2, failed: 1 })
  })
})

describe('uptimeLevel', () => {
  it('maps uptime to a severity', () => {
    expect(uptimeLevel(null)).toBe('none')
    expect(uptimeLevel(100)).toBe('ok')
    expect(uptimeLevel(97)).toBe('minor')
    expect(uptimeLevel(80)).toBe('major')
  })
})

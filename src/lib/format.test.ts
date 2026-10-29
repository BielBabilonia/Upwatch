import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatInterval,
  formatLatency,
  formatPercent,
  formatRelativeTime,
  hostOf,
} from './format'

describe('formatPercent', () => {
  it('drops decimals at exactly 100%', () => {
    expect(formatPercent(100, 'en')).toBe('100%')
  })

  it('never rounds a failure up to 100%', () => {
    expect(formatPercent(99.999, 'en')).toBe('99.99%')
  })

  it('localizes the decimal separator', () => {
    expect(formatPercent(99.5, 'pt-BR')).toBe('99,50%')
  })

  it('renders a dash without data', () => {
    expect(formatPercent(null, 'en')).toBe('—')
  })
})

describe('formatLatency', () => {
  it('uses ms below one second and s above', () => {
    expect(formatLatency(245.6, 'en')).toBe('246 ms')
    expect(formatLatency(1530, 'en')).toBe('1.53 s')
    expect(formatLatency(null, 'en')).toBe('—')
  })
})

describe('formatDuration', () => {
  it.each([
    [45_000, '45s'],
    [12 * 60_000, '12m'],
    [3 * 3_600_000, '3h'],
    [3 * 3_600_000 + 5 * 60_000, '3h 5m'],
    [2 * 86_400_000 + 4 * 3_600_000, '2d 4h'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })
})

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-01-01T12:00:00Z')

  it('says "now" for the last few seconds', () => {
    expect(formatRelativeTime(now - 3_000, 'en', now)).toBe('now')
  })

  it('picks the largest fitting unit', () => {
    expect(formatRelativeTime(now - 30_000, 'en', now)).toBe('30 seconds ago')
    expect(formatRelativeTime(now - 5 * 60_000, 'en', now)).toBe('5 minutes ago')
    expect(formatRelativeTime(new Date(now - 2 * 3_600_000).toISOString(), 'en', now)).toBe('2 hours ago')
    expect(formatRelativeTime(now - 86_400_000, 'en', now)).toBe('yesterday')
  })

  it('localizes', () => {
    expect(formatRelativeTime(now - 5 * 60_000, 'pt-BR', now)).toBe('há 5 minutos')
  })
})

describe('formatInterval / hostOf', () => {
  it('formats intervals', () => {
    expect(formatInterval(30)).toBe('30s')
    expect(formatInterval(300)).toBe('5m')
  })

  it('strips the protocol and a bare trailing slash', () => {
    expect(hostOf('https://acme.dev/')).toBe('acme.dev')
    expect(hostOf('https://api.acme.dev/health')).toBe('api.acme.dev/health')
    expect(hostOf('not a url')).toBe('not a url')
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { monitorsDb } from './db'

describe('monitorsDb', () => {
  beforeEach(() => monitorsDb.reset())

  it('seeds monitors with a week of history', () => {
    const monitors = monitorsDb.list()
    expect(monitors).toHaveLength(6)
    for (const monitor of monitors.filter((m) => !m.paused)) {
      expect(monitor.uptime24h).not.toBeNull()
      expect(monitor.avgLatency24h).not.toBeNull()
    }
  })

  it('opens the demo with one outage and one paused monitor', () => {
    const monitors = monitorsDb.list()
    expect(monitors.find((m) => m.name === 'Payments gateway')?.status).toBe('down')
    expect(monitors.find((m) => m.name === 'Docs')?.status).toBe('paused')
    const ongoing = monitorsDb.incidents().filter((i) => i.resolvedAt === null)
    expect(ongoing.map((i) => i.monitorName)).toEqual(['Payments gateway'])
  })

  it('downsamples detail checks for charting', () => {
    const [first] = monitorsDb.list()
    const detail = monitorsDb.get(first.id, '7d')
    expect(detail?.checks.length).toBeGreaterThan(100)
    expect(detail?.checks.length).toBeLessThanOrEqual(288)
  })

  it('creates a monitor with an immediate first check', () => {
    const created = monitorsDb.create({ name: 'New', url: 'https://example.com', intervalSec: 60 })
    expect(created.lastCheckedAt).not.toBeNull()
    expect(monitorsDb.list()).toHaveLength(7)
  })

  it('pauses, resumes and deletes monitors', () => {
    const [first] = monitorsDb.list()
    expect(monitorsDb.update(first.id, { paused: true })?.status).toBe('paused')
    expect(monitorsDb.update(first.id, { paused: false })?.status).not.toBe('paused')
    expect(monitorsDb.remove(first.id)).toBe(true)
    expect(monitorsDb.get(first.id, '24h')).toBeUndefined()
    expect(monitorsDb.incidents(first.id)).toEqual([])
  })
})

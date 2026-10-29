import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { ApiError, api } from './client'

describe('api client', () => {
  it('parses responses with zod', async () => {
    const monitors = await api.listMonitors()
    expect(monitors.length).toBeGreaterThan(0)
    expect(monitors[0]).toHaveProperty('status')
  })

  it('throws a typed http error with the server message', async () => {
    const error = await api.getMonitor('missing', '24h').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 404, message: 'Monitor not found', isNotFound: true })
  })

  it('rejects responses that do not match the schema', async () => {
    server.use(http.get('*/api/monitors', () => HttpResponse.json([{ id: 1 }])))
    await expect(api.listMonitors()).rejects.toMatchObject({ kind: 'parse' })
  })

  it('reports network failures', async () => {
    server.use(http.get('*/api/monitors', () => HttpResponse.error()))
    await expect(api.listMonitors()).rejects.toMatchObject({ kind: 'network' })
  })

  it('validates input on the mock server', async () => {
    await expect(
      api.createMonitor({ name: 'x', url: 'https://example.com', intervalSec: 60 }),
    ).rejects.toMatchObject({ status: 400 })
  })
})

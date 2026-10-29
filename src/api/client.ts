import { z } from 'zod'
import {
  apiErrorBodySchema,
  incidentSchema,
  monitorDetailSchema,
  monitorSchema,
  type MonitorInput,
  type MonitorPatch,
  type Range,
} from './schemas'

export type ApiErrorKind = 'http' | 'network' | 'parse'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }

  get isNotFound() {
    return this.status === 404
  }
}

let apiReady: Promise<unknown> = Promise.resolve()

/**
 * Requests wait for `promise` before hitting the network. The app renders
 * (skeletons) while the mock service worker boots instead of blocking on it.
 */
export function waitForApi(promise: Promise<unknown>) {
  apiReady = promise.catch(() => undefined)
}

function apiBase() {
  // Absolute URL so the same client works in the browser and in jsdom tests.
  return `${window.location.origin}/api`
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  await apiReady
  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch (error) {
    throw new ApiError('network', error instanceof Error ? error.message : 'Network error')
  }

  const body: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined)

  if (!response.ok) {
    const parsed = apiErrorBodySchema.safeParse(body)
    throw new ApiError('http', parsed.success ? parsed.data.message : response.statusText, response.status)
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ApiError('parse', `Unexpected response from ${path}: ${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const api = {
  listMonitors: () => request('/monitors', z.array(monitorSchema)),

  getMonitor: (id: string, range: Range) =>
    request(`/monitors/${encodeURIComponent(id)}?range=${range}`, monitorDetailSchema),

  createMonitor: (input: MonitorInput) =>
    request('/monitors', monitorSchema, { method: 'POST', body: JSON.stringify(input) }),

  updateMonitor: (id: string, patch: MonitorPatch) =>
    request(`/monitors/${encodeURIComponent(id)}`, monitorSchema, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteMonitor: (id: string) =>
    request(`/monitors/${encodeURIComponent(id)}`, z.undefined(), { method: 'DELETE' }),

  listIncidents: (monitorId?: string) =>
    request(
      monitorId ? `/incidents?monitorId=${encodeURIComponent(monitorId)}` : '/incidents',
      z.array(incidentSchema),
    ),
}

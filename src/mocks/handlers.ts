import { delay, http, HttpResponse } from 'msw'
import { monitorInputSchema, monitorPatchSchema, rangeSchema } from '../api/schemas'
import { monitorsDb } from './db'

const API = '/api'

/** Simulated network latency so loading states are visible. Instant in tests. */
function networkDelay() {
  return delay(import.meta.env.MODE === 'test' ? 0 : 150 + Math.random() * 250)
}

function notFound() {
  return HttpResponse.json({ message: 'Monitor not found' }, { status: 404 })
}

function badRequest(message: string) {
  return HttpResponse.json({ message }, { status: 400 })
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

export const handlers = [
  http.get(`${API}/monitors`, async () => {
    await networkDelay()
    return HttpResponse.json(monitorsDb.list())
  }),

  http.get(`${API}/monitors/:id`, async ({ params, request }) => {
    await networkDelay()
    const range = rangeSchema.safeParse(new URL(request.url).searchParams.get('range') ?? '24h')
    if (!range.success) return badRequest('Invalid range')
    const monitor = monitorsDb.get(String(params.id), range.data)
    return monitor ? HttpResponse.json(monitor) : notFound()
  }),

  http.post(`${API}/monitors`, async ({ request }) => {
    await networkDelay()
    const input = monitorInputSchema.safeParse(await readJson(request))
    if (!input.success) return badRequest(input.error.issues[0]?.message ?? 'Invalid body')
    return HttpResponse.json(monitorsDb.create(input.data), { status: 201 })
  }),

  http.patch(`${API}/monitors/:id`, async ({ params, request }) => {
    await networkDelay()
    const patch = monitorPatchSchema.safeParse(await readJson(request))
    if (!patch.success) return badRequest(patch.error.issues[0]?.message ?? 'Invalid body')
    const monitor = monitorsDb.update(String(params.id), patch.data)
    return monitor ? HttpResponse.json(monitor) : notFound()
  }),

  http.delete(`${API}/monitors/:id`, async ({ params }) => {
    await networkDelay()
    return monitorsDb.remove(String(params.id)) ? new HttpResponse(null, { status: 204 }) : notFound()
  }),

  http.get(`${API}/incidents`, async ({ request }) => {
    await networkDelay()
    const monitorId = new URL(request.url).searchParams.get('monitorId') ?? undefined
    return HttpResponse.json(monitorsDb.incidents(monitorId))
  }),
]

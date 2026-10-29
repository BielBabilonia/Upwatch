import type { Check, Incident, Monitor, MonitorInput, MonitorPatch, Range } from '../api/schemas'
import { DAY_MS as DAY, RANGE_MS } from '../lib/ranges'
import { avgLatencyOf, deriveStatus, uptimeOf } from '../lib/status'

/**
 * In-memory simulation of an uptime monitoring backend.
 *
 * Each monitor gets 7 days of seeded history at a 5-minute step. After that,
 * checks are generated lazily on every read, one per `intervalSec`, so the
 * dashboard looks live while polling. Outages are Markov-style: a failing
 * monitor keeps failing with probability OUTAGE_PERSISTENCE.
 */

const HISTORY_MS = RANGE_MS['7d']
const SEED_STEP_MS = 5 * 60 * 1000
const OUTAGE_PERSISTENCE = 0.7

interface Profile {
  baseLatency: number
  jitter: number
  /** Probability that a healthy check starts an outage. */
  failRate: number
  /** Probability of a latency spike above the degraded threshold. */
  spikeRate: number
}

interface SimMonitor {
  id: string
  name: string
  url: string
  intervalSec: number
  paused: boolean
  createdAt: number
  profile: Profile
  checks: Check[]
  lastSimAt: number
  failing: boolean
}

interface Db {
  monitors: SimMonitor[]
  incidents: Incident[]
  random: () => number
  nextMonitorId: number
  nextIncidentId: number
}

/** Deterministic PRNG so the demo looks the same on every load. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED: (Omit<SimMonitor, 'id' | 'checks' | 'lastSimAt' | 'failing' | 'createdAt' | 'paused'> & {
  paused?: boolean
})[] = [
  {
    name: 'Marketing site',
    url: 'https://www.acme.dev',
    intervalSec: 60,
    profile: { baseLatency: 120, jitter: 80, failRate: 0.0008, spikeRate: 0.004 },
  },
  {
    name: 'Public API',
    url: 'https://api.acme.dev/health',
    intervalSec: 30,
    profile: { baseLatency: 180, jitter: 120, failRate: 0.002, spikeRate: 0.01 },
  },
  {
    name: 'Auth service',
    url: 'https://auth.acme.dev/status',
    intervalSec: 60,
    profile: { baseLatency: 90, jitter: 40, failRate: 0.001, spikeRate: 0.003 },
  },
  {
    name: 'Payments gateway',
    url: 'https://pay.acme.dev/ping',
    intervalSec: 30,
    profile: { baseLatency: 320, jitter: 200, failRate: 0.004, spikeRate: 0.03 },
  },
  {
    name: 'Search cluster',
    url: 'https://search.acme.dev/_health',
    intervalSec: 60,
    profile: { baseLatency: 520, jitter: 360, failRate: 0.003, spikeRate: 0.04 },
  },
  {
    name: 'Docs',
    url: 'https://docs.acme.dev',
    intervalSec: 300,
    paused: true,
    profile: { baseLatency: 140, jitter: 60, failRate: 0.0005, spikeRate: 0.002 },
  },
]

const FAILURE_CAUSES = [
  { statusCode: 500, cause: 'HTTP 500 Internal Server Error' },
  { statusCode: 502, cause: 'HTTP 502 Bad Gateway' },
  { statusCode: 503, cause: 'HTTP 503 Service Unavailable' },
  { statusCode: null, cause: 'Connection timeout' },
] as const

let db: Db = createDb()

function createDb(now = Date.now()): Db {
  const state: Db = {
    monitors: [],
    incidents: [],
    random: mulberry32(42),
    nextMonitorId: 1,
    nextIncidentId: 1,
  }
  for (const seed of SEED) {
    const monitor: SimMonitor = {
      ...seed,
      id: `mon_${state.nextMonitorId++}`,
      paused: false,
      createdAt: now - HISTORY_MS,
      checks: [],
      lastSimAt: now - HISTORY_MS,
      failing: false,
    }
    state.monitors.push(monitor)
    simulate(state, monitor, now, SEED_STEP_MS)
    if (seed.paused) {
      // Paused a day ago: history stops there.
      const pausedAt = now - DAY
      monitor.checks = monitor.checks.filter((c) => Date.parse(c.at) < pausedAt)
      state.incidents = state.incidents.filter(
        (i) => i.monitorId !== monitor.id || Date.parse(i.startedAt) < pausedAt,
      )
      const open = openIncidentFor(state, monitor.id)
      if (open) open.resolvedAt = new Date(pausedAt).toISOString()
      monitor.paused = true
      monitor.failing = false
    }
  }
  // Leave one monitor mid-outage so the demo opens with something to look at.
  const payments = state.monitors[3]
  const [first, second] = payments.checks.slice(-2)
  for (const check of [first, second]) {
    Object.assign(check, { ok: false, latencyMs: null, statusCode: 503 })
  }
  payments.failing = true
  if (!openIncidentFor(state, payments.id)) {
    openIncident(state, payments, first.at, 'HTTP 503 Service Unavailable')
  }
  return state
}

function nextCheck(state: Db, monitor: SimMonitor, at: number): Check {
  const { profile } = monitor
  monitor.failing = monitor.failing
    ? state.random() < OUTAGE_PERSISTENCE
    : state.random() < profile.failRate
  if (monitor.failing) {
    const failure = FAILURE_CAUSES[Math.floor(state.random() * FAILURE_CAUSES.length)]
    return { at: new Date(at).toISOString(), ok: false, latencyMs: null, statusCode: failure.statusCode }
  }
  let latency = profile.baseLatency + (state.random() - 0.5) * 2 * profile.jitter * 0.5
  // A slow tail most of the time, a real spike sometimes.
  latency += Math.pow(state.random(), 4) * profile.jitter
  if (state.random() < profile.spikeRate) latency = 1000 + state.random() * 1800
  return { at: new Date(at).toISOString(), ok: true, latencyMs: Math.round(Math.max(20, latency)), statusCode: 200 }
}

function openIncident(state: Db, monitor: SimMonitor, at: string, cause: string) {
  state.incidents.push({
    id: `inc_${state.nextIncidentId++}`,
    monitorId: monitor.id,
    monitorName: monitor.name,
    startedAt: at,
    resolvedAt: null,
    cause,
  })
}

function openIncidentFor(state: Db, monitorId: string) {
  return state.incidents.find((i) => i.monitorId === monitorId && i.resolvedAt === null)
}

function simulate(state: Db, monitor: SimMonitor, now: number, stepMs = monitor.intervalSec * 1000) {
  if (monitor.paused) {
    monitor.lastSimAt = now
    return
  }
  while (monitor.lastSimAt + stepMs <= now) {
    monitor.lastSimAt += stepMs
    const check = nextCheck(state, monitor, monitor.lastSimAt)
    monitor.checks.push(check)
    const open = openIncidentFor(state, monitor.id)
    if (!check.ok && !open) {
      const cause = FAILURE_CAUSES.find((f) => f.statusCode === check.statusCode)?.cause ?? 'Unknown error'
      openIncident(state, monitor, check.at, cause)
    } else if (check.ok && open) {
      open.resolvedAt = check.at
    }
  }
  // Keep memory bounded: drop anything older than the longest range.
  const cutoff = now - HISTORY_MS
  const firstKept = monitor.checks.findIndex((c) => Date.parse(c.at) >= cutoff)
  if (firstKept > 0) monitor.checks.splice(0, firstKept)
}

function tick(now = Date.now()) {
  for (const monitor of db.monitors) simulate(db, monitor, now)
}

function checksSince(monitor: SimMonitor, since: number) {
  return monitor.checks.filter((c) => Date.parse(c.at) >= since)
}

function toMonitor(monitor: SimMonitor, now: number): Monitor {
  const last = monitor.checks.at(-1)
  const day = checksSince(monitor, now - DAY)
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    intervalSec: monitor.intervalSec,
    paused: monitor.paused,
    status: deriveStatus(monitor.paused, last),
    createdAt: new Date(monitor.createdAt).toISOString(),
    lastCheckedAt: last?.at ?? null,
    uptime24h: uptimeOf(day),
    avgLatency24h: avgLatencyOf(day),
  }
}

/**
 * Reduces checks to at most `maxPoints` for charting. Each bucket keeps a
 * failed check if it has one (so outages never disappear), otherwise the
 * average latency of the bucket.
 */
function downsample(checks: Check[], from: number, to: number, maxPoints: number): Check[] {
  if (checks.length <= maxPoints) return checks
  const size = (to - from) / maxPoints
  const buckets = new Map<number, Check[]>()
  for (const check of checks) {
    const index = Math.floor((Date.parse(check.at) - from) / size)
    const bucket = buckets.get(index)
    if (bucket) bucket.push(check)
    else buckets.set(index, [check])
  }
  return [...buckets.values()].map((bucket) => {
    const failed = bucket.find((c) => !c.ok)
    if (failed) return failed
    const avg = avgLatencyOf(bucket) ?? 0
    return { ...bucket[bucket.length - 1], latencyMs: Math.round(avg) }
  })
}

const MAX_CHART_POINTS = 144

export const monitorsDb = {
  list(): Monitor[] {
    const now = Date.now()
    tick(now)
    return db.monitors.map((m) => toMonitor(m, now))
  },

  get(id: string, range: Range) {
    const now = Date.now()
    tick(now)
    const monitor = db.monitors.find((m) => m.id === id)
    if (!monitor) return undefined
    const from = now - RANGE_MS[range]
    const checks = checksSince(monitor, from)
    return {
      ...toMonitor(monitor, now),
      range,
      uptime: uptimeOf(checks),
      avgLatency: avgLatencyOf(checks),
      checks: downsample(checks, from, now, MAX_CHART_POINTS),
    }
  },

  create(input: MonitorInput): Monitor {
    const now = Date.now()
    tick(now)
    const monitor: SimMonitor = {
      ...input,
      id: `mon_${db.nextMonitorId++}`,
      paused: false,
      createdAt: now,
      profile: { baseLatency: 100 + db.random() * 250, jitter: 80, failRate: 0.002, spikeRate: 0.01 },
      checks: [],
      // Run the first check right away so the monitor has a status.
      lastSimAt: now - input.intervalSec * 1000,
      failing: false,
    }
    db.monitors.push(monitor)
    simulate(db, monitor, now)
    return toMonitor(monitor, now)
  },

  update(id: string, patch: MonitorPatch): Monitor | undefined {
    const now = Date.now()
    tick(now)
    const monitor = db.monitors.find((m) => m.id === id)
    if (!monitor) return undefined
    if (patch.name !== undefined) monitor.name = patch.name
    if (patch.url !== undefined) monitor.url = patch.url
    if (patch.intervalSec !== undefined) monitor.intervalSec = patch.intervalSec
    if (patch.paused !== undefined && patch.paused !== monitor.paused) {
      monitor.paused = patch.paused
      if (patch.paused) {
        // Pausing closes any ongoing incident: we no longer know the state.
        const open = openIncidentFor(db, id)
        if (open) open.resolvedAt = new Date(now).toISOString()
        monitor.failing = false
      } else {
        // Resuming checks immediately.
        monitor.lastSimAt = now - monitor.intervalSec * 1000
        simulate(db, monitor, now)
      }
    }
    for (const incident of db.incidents) {
      if (incident.monitorId === id) incident.monitorName = monitor.name
    }
    return toMonitor(monitor, now)
  },

  remove(id: string): boolean {
    const index = db.monitors.findIndex((m) => m.id === id)
    if (index === -1) return false
    db.monitors.splice(index, 1)
    db.incidents = db.incidents.filter((i) => i.monitorId !== id)
    return true
  },

  incidents(monitorId?: string): Incident[] {
    tick()
    const cutoff = Date.now() - HISTORY_MS
    return db.incidents
      .filter((i) => (!monitorId || i.monitorId === monitorId) && Date.parse(i.startedAt) >= cutoff)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  },

  /** Restores the seeded state. Used by tests. */
  reset(now?: number) {
    db = createDb(now)
  },
}

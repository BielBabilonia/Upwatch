import { z } from 'zod'

export const rangeSchema = z.enum(['24h', '7d'])
export type Range = z.infer<typeof rangeSchema>

export const monitorStatusSchema = z.enum(['up', 'degraded', 'down', 'paused'])
export type MonitorStatus = z.infer<typeof monitorStatusSchema>

export const INTERVAL_OPTIONS = [30, 60, 300, 600] as const

export const checkSchema = z.object({
  at: z.iso.datetime(),
  ok: z.boolean(),
  latencyMs: z.number().nonnegative().nullable(),
  statusCode: z.number().int().nullable(),
})
export type Check = z.infer<typeof checkSchema>

export const monitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.url(),
  intervalSec: z.number().int().positive(),
  paused: z.boolean(),
  status: monitorStatusSchema,
  createdAt: z.iso.datetime(),
  lastCheckedAt: z.iso.datetime().nullable(),
  /** Percentage (0–100) of successful checks in the last 24h, null without data. */
  uptime24h: z.number().min(0).max(100).nullable(),
  /** Mean latency of successful checks in the last 24h, null without data. */
  avgLatency24h: z.number().nonnegative().nullable(),
})
export type Monitor = z.infer<typeof monitorSchema>

export const monitorDetailSchema = monitorSchema.extend({
  range: rangeSchema,
  uptime: z.number().min(0).max(100).nullable(),
  avgLatency: z.number().nonnegative().nullable(),
  checks: z.array(checkSchema),
})
export type MonitorDetail = z.infer<typeof monitorDetailSchema>

export const incidentSchema = z.object({
  id: z.string(),
  monitorId: z.string(),
  monitorName: z.string(),
  startedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
  cause: z.string(),
})
export type Incident = z.infer<typeof incidentSchema>

// Messages are i18n keys, translated by the form.
export const monitorInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'validation.nameMin' })
    .max(60, { error: 'validation.nameMax' }),
  url: z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: 'validation.url' }),
  intervalSec: z.literal(INTERVAL_OPTIONS, { error: 'validation.interval' }),
})
export type MonitorInput = z.infer<typeof monitorInputSchema>

export const monitorPatchSchema = monitorInputSchema.partial().extend({
  paused: z.boolean().optional(),
})
export type MonitorPatch = z.infer<typeof monitorPatchSchema>

export const apiErrorBodySchema = z.object({ message: z.string() })

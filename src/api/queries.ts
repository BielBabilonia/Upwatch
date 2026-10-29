import {
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError, api } from './client'
import type { Monitor, MonitorDetail, MonitorInput, MonitorPatch, Range } from './schemas'

export const POLL_INTERVAL_MS = 10_000

export const queryKeys = {
  all: ['upwatch'] as const,
  monitors: () => [...queryKeys.all, 'monitors'] as const,
  monitorList: () => [...queryKeys.monitors(), 'list'] as const,
  monitorDetails: (id: string) => [...queryKeys.monitors(), 'detail', id] as const,
  monitorDetail: (id: string, range: Range) => [...queryKeys.monitorDetails(id), range] as const,
  incidentLists: () => [...queryKeys.all, 'incidents'] as const,
  incidents: (monitorId?: string) => [...queryKeys.incidentLists(), monitorId ?? 'all'] as const,
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchInterval: POLL_INTERVAL_MS,
        staleTime: 5_000,
        // Retrying a 404 only delays the "not found" screen.
        retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
      },
    },
  })
}

export function useMonitors() {
  return useQuery({ queryKey: queryKeys.monitorList(), queryFn: api.listMonitors })
}

export function useMonitor(id: string, range: Range) {
  return useQuery({
    queryKey: queryKeys.monitorDetail(id, range),
    queryFn: () => api.getMonitor(id, range),
    // Keep the chart on screen while switching ranges.
    placeholderData: (previous) => (previous?.id === id ? previous : undefined),
  })
}

export function useMonitorDetails(ids: readonly string[], range: Range) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.monitorDetail(id, range),
      queryFn: () => api.getMonitor(id, range),
    })),
  })
}

export function useIncidents(monitorId?: string) {
  return useQuery({
    queryKey: queryKeys.incidents(monitorId),
    queryFn: () => api.listIncidents(monitorId),
  })
}

export function useCreateMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MonitorInput) => api.createMonitor(input),
    onSuccess: (monitor) => {
      queryClient.setQueryData<Monitor[]>(queryKeys.monitorList(), (list) =>
        list ? [...list, monitor] : list,
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.monitors() }),
  })
}

interface Snapshot {
  list: Monitor[] | undefined
  details: [readonly unknown[], MonitorDetail | undefined][]
}

/** Applies `update` to the monitor in every cached list and detail; returns a rollback snapshot. */
async function patchCachedMonitor(
  queryClient: QueryClient,
  id: string,
  update: (monitor: Monitor) => Monitor | null,
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: queryKeys.monitors() })
  const snapshot: Snapshot = {
    list: queryClient.getQueryData<Monitor[]>(queryKeys.monitorList()),
    details: queryClient.getQueriesData<MonitorDetail>({ queryKey: queryKeys.monitorDetails(id) }),
  }
  queryClient.setQueryData<Monitor[]>(queryKeys.monitorList(), (list) =>
    list?.flatMap((m) => {
      if (m.id !== id) return [m]
      const next = update(m)
      return next ? [next] : []
    }),
  )
  queryClient.setQueriesData<MonitorDetail>({ queryKey: queryKeys.monitorDetails(id) }, (detail) => {
    if (!detail) return detail
    const next = update(detail)
    return next ? { ...detail, ...next } : detail
  })
  return snapshot
}

function restore(queryClient: QueryClient, snapshot: Snapshot | undefined) {
  if (!snapshot) return
  queryClient.setQueryData(queryKeys.monitorList(), snapshot.list)
  for (const [key, data] of snapshot.details) queryClient.setQueryData(key, data)
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: MonitorPatch }) => api.updateMonitor(id, patch),
    onMutate: ({ id, patch }) =>
      patchCachedMonitor(queryClient, id, (monitor) => ({
        ...monitor,
        ...patch,
        // Paused wins every other status; on resume the server decides.
        status: patch.paused ? 'paused' : monitor.status,
      })),
    onError: (_error, _variables, snapshot) => restore(queryClient, snapshot),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitors() })
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentLists() })
    },
  })
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteMonitor(id),
    onMutate: (id) => patchCachedMonitor(queryClient, id, () => null),
    onError: (_error, _id, snapshot) => restore(queryClient, snapshot),
    onSuccess: (_data, id) => queryClient.removeQueries({ queryKey: queryKeys.monitorDetails(id) }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitorList() })
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentLists() })
    },
  })
}

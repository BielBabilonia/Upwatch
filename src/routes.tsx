import type { RouteObject } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { NotFoundPage } from './components/layout/NotFoundPage'
import { PageFallback } from './components/layout/PageFallback'

// Pages are code-split; Recharts only loads with the detail page.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    hydrateFallbackElement: <PageFallback />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./features/monitors/MonitorsPage')).MonitorsPage }),
      },
      {
        path: 'monitors/:id',
        lazy: async () => ({
          Component: (await import('./features/monitors/MonitorDetailPage')).MonitorDetailPage,
        }),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
  {
    path: 'status',
    hydrateFallbackElement: <PageFallback />,
    lazy: async () => ({ Component: (await import('./features/status-page/StatusPage')).StatusPage }),
  },
]

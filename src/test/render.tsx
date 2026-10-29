import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from '../AppProviders'
import { routes } from '../routes'

/** Renders the real app (routes, providers, mock API) at `path`. */
export function renderApp(path = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchInterval: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const result = render(
    <AppProviders queryClient={queryClient} locale="en">
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...result, router, queryClient }
}

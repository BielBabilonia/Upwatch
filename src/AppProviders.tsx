import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from './api/queries'
import { ToastProvider } from './components/ui/ToastProvider'
import { I18nProvider } from './i18n/I18nProvider'
import type { Locale } from './i18n/i18n-context'
import { ThemeProvider } from './theme/ThemeProvider'

interface AppProvidersProps {
  children: ReactNode
  /** Overrides for tests. */
  queryClient?: QueryClient
  locale?: Locale
}

export function AppProviders({ children, queryClient: injected, locale }: AppProvidersProps) {
  const [queryClient] = useState(() => injected ?? createQueryClient())
  return (
    <ThemeProvider>
      <I18nProvider locale={locale}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../../i18n/i18n-context'
import { cn } from '../../lib/cn'
import { GithubIcon, LogoMark } from '../ui/icons'
import { LanguageToggle, ThemeToggle } from './Preferences'
import { PageFallback } from './PageFallback'
import { REPO_URL } from '../../lib/links'


function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isActive ? 'bg-surface-muted text-fg' : 'text-muted hover:text-fg',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function AppLayout() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-linear-to-r from-accent-from to-accent-to px-3 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('app.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight">
            <LogoMark className="size-7" />
            <span>{t('app.name')}</span>
          </Link>
          <nav aria-label={t('nav.main')} className="flex items-center gap-1">
            <NavItem to="/">{t('nav.monitors')}</NavItem>
            <NavItem to="/status">{t('nav.statusPage')}</NavItem>
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:px-6">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t('app.demoNotice')}</p>
          <div className="flex items-center gap-2 sm:hidden">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md hover:text-fg"
          >
            <GithubIcon className="size-4" />
            {t('app.sourceCode')}
          </a>
        </div>
      </footer>
    </div>
  )
}

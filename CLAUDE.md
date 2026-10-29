# Upwatch

Portfolio project: uptime monitoring dashboard (inspired by Better Stack / status pages).
Goal: impress international frontend recruiters. Simple scope, high polish.
All UI text, code, commits and README in English.

## Stack
- React 19 + Vite + TypeScript (TS pinned to ~6.0 — typescript-eslint doesn't support 7 yet)
- Tailwind CSS v4 via `@tailwindcss/vite`. Design tokens are CSS variables in `src/index.css` (`@theme inline`)
- TanStack Query, React Router, Zod v4, Recharts
- MSW **v3** simulates the whole API (no backend). Worker runs in production too, for the demo.
  v3 API: `http`/`HttpResponse`/`delay` from `msw`, `setupWorker` from `msw/browser`,
  and the start option is `onUnhandledFrame` (not `onUnhandledRequest`).
- Vitest + Testing Library (jsdom, MSW node server in `src/test/setup.ts`), Playwright for E2E (`e2e/`)
- Deploy: Vercel (`vercel.json` SPA rewrite). CI: GitHub Actions (`.github/workflows/ci.yml`)

## Architecture
- `src/api/` — `schemas.ts` (Zod, source of every type), `client.ts` (typed fetch + Zod parsing + `ApiError`),
  `queries.ts` (query key factory, hooks, optimistic mutations, 10s polling)
- `src/mocks/` — `db.ts` in-memory simulation (seeded PRNG, 7d history at 5-min step, live checks generated
  lazily per `intervalSec`, Markov-style outages, auto incidents), `handlers.ts` REST under `/api`
- `src/lib/status.ts` — status rules shared by mock and UI: paused > down > degraded (>1000ms) > up
- `src/features/{monitors,incidents,status-page}` — feature folders; route pages are lazy-loaded
- `src/components/ui/` — primitives; `src/components/layout/` — shell
- `src/i18n/` — EN (default) + PT-BR, flat typed dictionary, `useI18n().t(key, vars)`
- `src/theme/` — system/light/dark, `.dark` class on `<html>`, no-flash script in `index.html`

## Conventions
- Strict TS, no `any`. Types come from Zod (`z.infer`), never duplicated.
- Server state only in TanStack Query; local UI state in components. No global store.
- Feature-based folders; small components, named exports (route pages included, loaded via `lazy`).
- Tailwind only, no CSS files besides `index.css`. Use the semantic tokens (`bg-surface`, `text-muted`, ...).
- Every user-facing string goes through i18n (both `en.ts` and `pt-BR.ts`).
- Run `npm run typecheck`, `npm run lint` and `npm test` before finishing any task.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). Several small commits per change.
- Ask before adding any dependency not listed above.

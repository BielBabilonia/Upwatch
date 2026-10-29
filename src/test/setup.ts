import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { monitorsDb } from '../mocks/db'
import { server } from './server'

// Route chunks (Recharts) load lazily; the first import can take over a second.
configure({ asyncUtilTimeout: 5000 })

// --- jsdom gaps -----------------------------------------------------------

window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// Recharts measures its container.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom has <dialog> but not its modal API.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
}

// --- mock API -------------------------------------------------------------

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  monitorsDb.reset()
  window.localStorage.clear()
})
afterAll(() => server.close())

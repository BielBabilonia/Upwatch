import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/render'
import { server } from '../../test/server'

function desktopTable() {
  return screen.getByRole('table', { name: 'Monitors list' })
}

describe('MonitorsPage', () => {
  it('shows summary cards and every monitor', async () => {
    renderApp('/')
    const table = await screen.findByRole('table', { name: 'Monitors list' })
    expect(within(table).getAllByRole('row')).toHaveLength(7) // header + 6 monitors
    expect(within(table).getByRole('link', { name: 'Payments gateway' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/monitors\//),
    )
    expect(screen.getByText('Avg. uptime')).toBeInTheDocument()
  })

  it('filters by search and status', async () => {
    renderApp('/')
    await screen.findByRole('table', { name: 'Monitors list' })

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search monitors' }), { target: { value: 'auth' } })
    expect(within(desktopTable()).getAllByRole('row')).toHaveLength(2)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    fireEvent.click(within(screen.getByRole('group', { name: 'Filter by status' })).getByRole('button', { name: 'Paused' }))
    expect(within(desktopTable()).getByRole('link', { name: 'Docs' })).toBeInTheDocument()
    expect(within(desktopTable()).getAllByRole('row')).toHaveLength(2)
  })

  it('shows an empty state for no results and clears filters', async () => {
    renderApp('/')
    await screen.findByRole('table', { name: 'Monitors list' })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } })
    expect(screen.getByText('No matching monitors')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(within(desktopTable()).getAllByRole('row')).toHaveLength(7)
  })

  it('shows an error state with retry', async () => {
    server.use(http.get('*/api/monitors', () => HttpResponse.json({ message: 'boom' }, { status: 500 })))
    renderApp('/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')

    server.resetHandlers()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('table', { name: 'Monitors list' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no monitors', async () => {
    server.use(http.get('*/api/monitors', () => HttpResponse.json([])))
    renderApp('/')
    expect(await screen.findByText('No monitors yet')).toBeInTheDocument()
  })
})

describe('MonitorFormModal', () => {
  it('validates input before submitting', async () => {
    renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: 'New monitor' }))
    const dialog = screen.getByRole('dialog', { name: 'New monitor' })

    fireEvent.change(within(dialog).getByLabelText('URL'), { target: { value: 'ftp://nope' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create monitor' }))

    expect(within(dialog).getByLabelText('Name')).toHaveAccessibleDescription(
      'Name must have at least 2 characters.',
    )
    expect(within(dialog).getByLabelText('URL')).toHaveAttribute('aria-invalid', 'true')
  })

  it('creates a monitor and opens its page', async () => {
    const { router } = renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: 'New monitor' }))
    const dialog = screen.getByRole('dialog', { name: 'New monitor' })

    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Landing page' } })
    fireEvent.change(within(dialog).getByLabelText('URL'), { target: { value: 'https://landing.example.com' } })
    fireEvent.change(within(dialog).getByLabelText('Check interval'), { target: { value: '300' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create monitor' }))

    expect(await screen.findByText('Monitor “Landing page” created')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/monitors\/mon_\d+$/))
    expect(await screen.findByRole('heading', { level: 1, name: 'Landing page' })).toBeInTheDocument()
  })
})

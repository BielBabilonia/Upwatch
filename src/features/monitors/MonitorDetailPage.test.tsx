import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/render'

// Seeded monitors: mon_1 Marketing site ... mon_4 Payments gateway (down), mon_6 Docs (paused).

describe('MonitorDetailPage', () => {
  it('shows stats, chart and incidents', async () => {
    renderApp('/monitors/mon_4')
    expect(await screen.findByRole('heading', { level: 1, name: 'Payments gateway' })).toBeInTheDocument()
    expect(screen.getByText('Uptime')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /Response time chart/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Uptime history/ })).toBeInTheDocument()
    expect(await screen.findByText('Ongoing')).toBeInTheDocument()
  })

  it('switches range through the URL', async () => {
    const { router } = renderApp('/monitors/mon_1')
    await screen.findByRole('heading', { level: 1, name: 'Marketing site' })
    fireEvent.click(within(screen.getByRole('group', { name: 'Time range' })).getByRole('button', { name: '7 days' }))
    await waitFor(() => expect(router.state.location.search).toBe('?range=7d'))
    expect(await screen.findByText('One square per 2 hours')).toBeInTheDocument()
  })

  it('pauses and resumes a monitor', async () => {
    renderApp('/monitors/mon_1')
    fireEvent.click(await screen.findByRole('button', { name: 'Pause' }))
    expect(await screen.findByText('Monitor “Marketing site” paused')).toBeInTheDocument()
    expect(screen.getByText(/This monitor is paused/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(await screen.findByText('Monitor “Marketing site” resumed')).toBeInTheDocument()
  })

  it('edits a monitor', async () => {
    renderApp('/monitors/mon_2')
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit monitor' })
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Public API')

    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Public API v2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Public API v2' })).toBeInTheDocument()
  })

  it('deletes after confirmation and returns to the list', async () => {
    const { router } = renderApp('/monitors/mon_3')
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete “Auth service”?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete monitor' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Monitor “Auth service” deleted')).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Monitors list' })
    expect(within(table).queryByRole('link', { name: 'Auth service' })).not.toBeInTheDocument()
  })

  it('shows not found for unknown monitors', async () => {
    renderApp('/monitors/nope')
    expect(await screen.findByText('Monitor not found')).toBeInTheDocument()
  })
})

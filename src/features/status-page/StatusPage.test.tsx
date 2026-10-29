import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { monitorsDb } from '../../mocks/db'
import { renderApp } from '../../test/render'

describe('StatusPage', () => {
  it('reports a partial outage while a service is down', async () => {
    renderApp('/status')
    expect(await screen.findByText('Partial outage')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'New monitor' })).not.toBeInTheDocument()
  })

  it('reports all systems operational when everything is up', async () => {
    const payments = monitorsDb.list().find((m) => m.name === 'Payments gateway')!
    monitorsDb.remove(payments.id)
    renderApp('/status')
    expect(await screen.findByText('All systems operational')).toBeInTheDocument()
  })

  it('lists services with uptime bars and recent incidents', async () => {
    renderApp('/status')
    const services = await screen.findByRole('region', { name: 'Services' })
    expect(within(services).getAllByRole('listitem').length).toBeGreaterThanOrEqual(6)
    expect(await within(services).findByRole('img', { name: /^Public API: .* uptime$/ })).toBeInTheDocument()
    const incidents = screen.getByRole('region', { name: 'Recent incidents' })
    expect(await within(incidents).findByText('Ongoing')).toBeInTheDocument()
  })
})

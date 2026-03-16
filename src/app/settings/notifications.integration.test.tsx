import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from './page'

vi.mock('@/lib/notifications', () => {
  return {
    Notifications: {
      isEnabled: vi.fn(() => false),
      setEnabled: vi.fn(),
      ensurePermission: vi.fn(async () => true),
    },
  }
})

describe('Settings notifications section', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.Notification = { permission: 'default', requestPermission: vi.fn(async () => 'granted') }
  })

  it('enables reminders when clicking "Ativar lembretes"', async () => {
    render(<SettingsPage />)
    const btn = await screen.findByRole('button', { name: /ativar lembretes/i })
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByText(/status: ativado/i)).toBeInTheDocument()
    })
  })
})


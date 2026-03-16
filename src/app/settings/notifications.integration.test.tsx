import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from './page'

const mocks = vi.hoisted(() => ({
  isEnabled: vi.fn(() => false),
  setEnabled: vi.fn(),
  ensurePermission: vi.fn(async () => true),
  toast: vi.fn(),
  exportData: vi.fn(),
  previewImportData: vi.fn(),
  importData: vi.fn(),
  importDataByEvents: vi.fn(),
  resetData: vi.fn(),
  seedDemo: vi.fn(),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/stores/events-store', () => ({
  useEventsStore: (selector: (store: unknown) => unknown) =>
    selector({
      events: [],
      expenses: [],
      exportData: mocks.exportData,
      previewImportData: mocks.previewImportData,
      importData: mocks.importData,
      importDataByEvents: mocks.importDataByEvents,
      resetData: mocks.resetData,
      seedDemo: mocks.seedDemo,
    }),
}))

vi.mock('@/lib/notifications', () => {
  return {
    Notifications: {
      isEnabled: mocks.isEnabled,
      setEnabled: mocks.setEnabled,
      ensurePermission: mocks.ensurePermission,
    },
  }
})

vi.mock('@/components/ui/use-toast', () => ({
  toast: mocks.toast,
}))

describe('Settings notifications section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('restaura apenas eventos selecionados do backup', async () => {
    const backupJson = '{"version":1}'
    mocks.previewImportData.mockResolvedValue([
      {
        id: 'event-1',
        title: 'Rock in Rio',
        artist: 'Foo',
        date: '2026-09-10',
        city: 'Rio de Janeiro',
        venue: 'Cidade do Rock',
      },
      {
        id: 'event-2',
        title: 'Lolla',
        artist: 'Bar',
        date: '2026-09-12',
        city: 'São Paulo',
        venue: 'Interlagos',
      },
    ])
    mocks.importDataByEvents.mockResolvedValue(undefined)

    const { container } = render(<SettingsPage />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([backupJson], 'backup.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(backupJson) })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mocks.previewImportData).toHaveBeenCalledWith(backupJson)
    })
    await screen.findByRole('heading', { name: /restaurar backup/i })
    fireEvent.click(screen.getByText('Lolla'))
    fireEvent.click(screen.getByRole('button', { name: /restaurar selecionados/i }))

    await waitFor(() => {
      expect(mocks.importDataByEvents).toHaveBeenCalledWith(backupJson, ['event-1'])
    })
  })

  it('restaura backup completo quando solicitado', async () => {
    const backupJson = '{"version":1}'
    mocks.previewImportData.mockResolvedValue([
      {
        id: 'event-1',
        title: 'Rock in Rio',
        artist: 'Foo',
        date: '2026-09-10',
        city: 'Rio de Janeiro',
        venue: 'Cidade do Rock',
      },
    ])
    mocks.importData.mockResolvedValue(undefined)

    const { container } = render(<SettingsPage />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([backupJson], 'backup.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(backupJson) })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mocks.previewImportData).toHaveBeenCalledWith(backupJson)
    })
    await screen.findByRole('heading', { name: /restaurar backup/i })
    fireEvent.click(screen.getByRole('button', { name: /restaurar tudo/i }))

    await waitFor(() => {
      expect(mocks.importData).toHaveBeenCalledWith(backupJson)
    })
  })
})

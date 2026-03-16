import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/stores/events-store'
import { AppShell } from '@/components/app-shell/app-shell'

vi.mock('@/stores/events-store', () => ({
  useEventsStore: vi.fn(),
}))

vi.mock('@/components/navigation/bottom-nav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}))

vi.mock('@/lib/notifications', () => ({
  Notifications: {
    runRemindersForEvents: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/domain/auto-backup', () => ({
  getAutoBackupConfig: vi.fn(() => ({ retention: 7, frequency: 'weekly' })),
  shouldRunAutoBackup: vi.fn(() => false),
}))

describe('AppShell integration', () => {
  it('hidrata store no mount e renderiza conteúdo', async () => {
    const ensureHydrated = vi.fn().mockResolvedValue(undefined)
    const createAutoBackupSnapshot = vi.fn().mockResolvedValue(undefined)
    const listAutoBackupSnapshots = vi.fn().mockResolvedValue([])
    const pruneAutoBackupSnapshots = vi.fn().mockResolvedValue(undefined)
    const state = {
      ensureHydrated,
      createAutoBackupSnapshot,
      listAutoBackupSnapshots,
      pruneAutoBackupSnapshots,
      events: [],
    }
    vi.mocked(useEventsStore).mockImplementation((selector) => selector(state as never))

    render(
      <AppShell>
        <div>conteudo</div>
      </AppShell>,
    )

    expect(screen.getByText('conteudo')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    await waitFor(() => {
      expect(ensureHydrated).toHaveBeenCalledTimes(1)
    })
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getAutoBackupConfig,
  setAutoBackupConfig,
  shouldRunAutoBackup,
} from '@/lib/domain/auto-backup'

describe('auto-backup domain', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('retorna configuração padrão quando ainda não há persistência', () => {
    expect(getAutoBackupConfig()).toEqual({
      enabled: false,
      frequency: 'daily',
      retention: 7,
    })
  })

  it('normaliza retenção e persiste configuração válida', () => {
    const saved = setAutoBackupConfig({
      enabled: true,
      frequency: 'weekly',
      retention: 999,
    })

    expect(saved).toEqual({
      enabled: true,
      frequency: 'weekly',
      retention: 60,
    })
    expect(getAutoBackupConfig()).toEqual(saved)
  })

  it('agenda backup diário após 24h', () => {
    const now = new Date('2026-03-10T12:00:00.000Z')
    expect(
      shouldRunAutoBackup({
        config: { enabled: true, frequency: 'daily', retention: 7 },
        now,
        lastBackupAt: '2026-03-09T12:00:00.000Z',
      }),
    ).toBe(true)
    expect(
      shouldRunAutoBackup({
        config: { enabled: true, frequency: 'daily', retention: 7 },
        now,
        lastBackupAt: '2026-03-10T01:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('agenda backup semanal após 7 dias', () => {
    const now = new Date('2026-03-10T12:00:00.000Z')
    expect(
      shouldRunAutoBackup({
        config: { enabled: true, frequency: 'weekly', retention: 7 },
        now,
        lastBackupAt: '2026-03-03T11:59:00.000Z',
      }),
    ).toBe(true)
    expect(
      shouldRunAutoBackup({
        config: { enabled: true, frequency: 'weekly', retention: 7 },
        now,
        lastBackupAt: '2026-03-05T12:00:00.000Z',
      }),
    ).toBe(false)
  })
})

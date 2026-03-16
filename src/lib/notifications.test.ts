import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Notifications, getReminderTargets } from './notifications'
import type { Event } from '@/types'

declare global {
  var Notification: unknown
}

function mockNotificationEnv() {
  // @ts-expect-error jsdom global
  global.Notification = {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  }
  // @ts-expect-error jsdom global
  global.navigator.serviceWorker = {
    getRegistration: vi.fn().mockResolvedValue({
      showNotification: vi.fn().mockResolvedValue(undefined),
    }),
  }
}

describe('notifications', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNotificationEnv()
  })

  it('computes D-7 and D-1 at 09:00 local', () => {
    const targets = getReminderTargets('2026-03-20')
    const d7 = targets.find((t) => t.kind === 'D-7')!
    const d1 = targets.find((t) => t.kind === 'D-1')!
    expect(d7.at.getHours()).toBe(9)
    expect(d1.at.getHours()).toBe(9)
    // Dates match (not timezones sensitive due to local constructor)
    expect(d7.at.getDate()).toBe(13)
    expect(d1.at.getDate()).toBe(19)
  })

  it('runs reminders for events and deduplicates', async () => {
    Notifications.setEnabled(true)
    const event: Event = {
      id: 'e1',
      title: 'Show X',
      artist: 'Banda Y',
      type: 'show',
      status: 'ativo',
      date: '2026-03-20',
      city: 'SP',
      state: 'SP',
      venue: 'Allianz',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const now = new Date(2026, 2, 13, 10, 0, 0, 0) // 2026-03-13 10:00 local — D-7
    const count1 = await Notifications.runRemindersForEvents([event], now)
    expect(count1).toBe(1)
    const count2 = await Notifications.runRemindersForEvents([event], now)
    expect(count2).toBe(0) // deduped
  })
})

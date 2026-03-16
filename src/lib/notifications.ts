import type { Event } from '@/types'
import { format } from 'date-fns'

type ReminderKind = 'D-7' | 'D-1'

const LS_ENABLED_KEY = 'notifications.enabled'
const LS_NOTIFIED_PREFIX = 'notifications.notified'

function parseEventDateAtNine(dateStr: string): Date {
  // Use local time 09:00 of the event's start date
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10))
  // Months are 0-based
  return new Date(y, (m ?? 1) - 1, d ?? 1, 9, 0, 0, 0)
}

export function getReminderTargets(dateStr: string): Array<{ kind: ReminderKind; at: Date }> {
  const base = parseEventDateAtNine(dateStr)
  const d7 = new Date(base)
  d7.setDate(base.getDate() - 7)
  const d1 = new Date(base)
  d1.setDate(base.getDate() - 1)
  return [
    { kind: 'D-7', at: d7 },
    { kind: 'D-1', at: d1 },
  ]
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function isEnabled(): boolean {
  if (!isNotificationSupported()) return false
  return localStorage.getItem(LS_ENABLED_KEY) === 'true'
}

export function setEnabled(value: boolean): void {
  if (!isNotificationSupported()) return
  localStorage.setItem(LS_ENABLED_KEY, value ? 'true' : 'false')
}

export async function ensurePermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function notifiedKey(eventId: string, kind: ReminderKind): string {
  return `${LS_NOTIFIED_PREFIX}.${eventId}.${kind}`
}

function hasNotified(eventId: string, kind: ReminderKind): boolean {
  return localStorage.getItem(notifiedKey(eventId, kind)) === 'true'
}

function markNotified(eventId: string, kind: ReminderKind): void {
  localStorage.setItem(notifiedKey(eventId, kind), 'true')
}

function buildNotificationPayload(event: Event, kind: ReminderKind) {
  const when =
    kind === 'D-7'
      ? 'Faltam 7 dias!'
      : 'É amanhã!'
  const title = `${when} ${event.title}`
  const body = [
    event.artist && event.artist !== event.title ? event.artist : null,
    `${format(parseEventDateAtNine(event.date), 'dd/MM/yyyy')}${event.time ? ` · ${event.time}` : ''}`,
    `${event.city}, ${event.state}`,
  ]
    .filter(Boolean)
    .join(' · ')
  const data = {
    url: `/events/${event.id}`,
    eventId: event.id,
    kind,
  }
  return { title, options: { body, badge: '/icons/icon-72x72.png', icon: '/icons/icon-192x192.png', data } as NotificationOptions }
}

async function showNotification(title: string, options: NotificationOptions): Promise<void> {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(title, options)
      return
    }
  } catch {
    // ignore and fallback
  }
  // Fallback (may show a page-level notification)
  new Notification(title, options)
}

export async function notifyEventReminder(event: Event, kind: ReminderKind): Promise<boolean> {
  if (!isNotificationSupported() || !isEnabled()) return false
  if (!(await ensurePermission())) return false
  if (hasNotified(event.id, kind)) return false
  const { title, options } = buildNotificationPayload(event, kind)
  await showNotification(title, options)
  markNotified(event.id, kind)
  return true
}

function isSameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export async function runRemindersForEvents(events: Event[], now: Date = new Date()): Promise<number> {
  if (!isNotificationSupported() || !isEnabled()) return 0
  const upcoming = events.filter((e) => {
    const eventDay = parseEventDateAtNine(e.date)
    // ignore past events
    return eventDay >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })

  let count = 0
  for (const e of upcoming) {
    const targets = getReminderTargets(e.date)
    for (const t of targets) {
      if (isSameLocalDate(t.at, now) && !hasNotified(e.id, t.kind)) {
        const ok = await notifyEventReminder(e, t.kind)
        if (ok) count++
      }
    }
  }
  return count
}

export const Notifications = {
  isSupported: isNotificationSupported,
  isEnabled,
  setEnabled,
  ensurePermission,
  getReminderTargets,
  runRemindersForEvents,
  notifyEventReminder,
}

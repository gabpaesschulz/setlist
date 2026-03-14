import { addDays, addHours } from 'date-fns'
import type { Event } from '@/types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

export function createEventCalendarIcs(event: Event): string {
  if (!DATE_PATTERN.test(event.date)) {
    throw new Error('Data do evento invalida para exportacao de calendario.')
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Setlist App//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${buildUid(event.id)}`,
    `DTSTAMP:${formatUtcDateTime(new Date())}`,
    ...buildDateLines(event),
    `SUMMARY:${escapeIcsText(event.title || event.artist || 'Evento')}`,
    `LOCATION:${escapeIcsText(buildLocation(event))}`,
    ...buildDescriptionLine(event),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.join('\r\n')}\r\n`
}

export function downloadEventCalendar(event: Event): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Download de calendario indisponivel fora do navegador.')
  }

  const content = createEventCalendarIcs(event)
  const fileName = `${slugifyFileName(event.title || event.artist || 'evento')}-${event.date}.ics`
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
  return fileName
}

function buildDateLines(event: Event): string[] {
  if (event.time && TIME_PATTERN.test(event.time)) {
    const start = createDateTime(event.date, event.time)
    if (!start) {
      throw new Error('Data ou horario invalido para exportacao.')
    }

    const end = event.endDate && DATE_PATTERN.test(event.endDate)
      ? createDateTime(event.endDate, event.time)
      : addHours(start, 2)

    const safeEnd = !end || end <= start ? addHours(start, 2) : end

    return [
      `DTSTART:${formatLocalDateTime(start)}`,
      `DTEND:${formatLocalDateTime(safeEnd)}`,
    ]
  }

  const startDate = parseDateOnly(event.date)
  if (!startDate) {
    throw new Error('Data invalida para exportacao.')
  }

  const endBase = event.endDate && DATE_PATTERN.test(event.endDate)
    ? parseDateOnly(event.endDate)
    : startDate
  const endExclusive = addDays(endBase ?? startDate, 1)

  return [
    `DTSTART;VALUE=DATE:${formatDateOnly(startDate)}`,
    `DTEND;VALUE=DATE:${formatDateOnly(endExclusive)}`,
  ]
}

function buildLocation(event: Event): string {
  const parts = [event.venue, `${event.city}, ${event.state}`]
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.join(', ')
}

function buildDescriptionLine(event: Event): string[] {
  const chunks: string[] = []

  if (event.artist && event.artist !== event.title) {
    chunks.push(`Artista: ${event.artist}`)
  }

  if (event.notes?.trim()) {
    chunks.push(event.notes.trim())
  }

  if (chunks.length === 0) {
    return []
  }

  return [`DESCRIPTION:${escapeIcsText(chunks.join('\n\n'))}`]
}

function buildUid(eventId: string): string {
  const sanitized = eventId.replace(/[^a-zA-Z0-9_.-]/g, '-')
  return `${sanitized || 'event'}@setlist-app`
}

function createDateTime(date: string, time: string): Date | null {
  const dateOnly = parseDateOnly(date)
  if (!dateOnly || !TIME_PATTERN.test(time)) {
    return null
  }

  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  const out = new Date(dateOnly)
  out.setHours(hours, minutes, 0, 0)
  return out
}

function parseDateOnly(date: string): Date | null {
  if (!DATE_PATTERN.test(date)) return null

  const [year, month, day] = date.split('-').map(Number)
  const out = new Date(year, month - 1, day)
  if (
    out.getFullYear() !== year
    || out.getMonth() !== month - 1
    || out.getDate() !== day
  ) {
    return null
  }
  return out
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatLocalDateTime(date: Date): string {
  const datePart = formatDateOnly(date)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${datePart}T${hours}${minutes}${seconds}`
}

function formatUtcDateTime(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function slugifyFileName(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return slug || 'evento'
}

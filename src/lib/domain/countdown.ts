import {
  parseISO,
  isValid,
  differenceInCalendarDays,
  differenceInSeconds,
  startOfDay,
  isToday,
  isTomorrow,
} from 'date-fns'
import type { CountdownResult } from '@/types'

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Builds a Date from an ISO date string and an optional HH:MM time string.
 * When no time is provided the event is treated as occurring at midnight (start of day).
 */
function buildEventDate(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null

  const base = parseISO(dateStr)
  if (!isValid(base)) return null

  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const withTime = new Date(base)
    withTime.setHours(hours, minutes, 0, 0)
    return withTime
  }

  // No specific time – compare at calendar-day granularity using start of day
  return startOfDay(base)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a structured countdown from now to the event date/time.
 */
export function getCountdown(dateStr: string, timeStr?: string): CountdownResult {
  const eventDate = buildEventDate(dateStr, timeStr)

  if (!eventDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      label: 'Data inválida',
      isPast: false,
      isToday: false,
      isTomorrow: false,
    }
  }

  const now = new Date()
  const totalSeconds = differenceInSeconds(eventDate, now)
  const isPast = totalSeconds < 0

  const absTotalSeconds = Math.abs(totalSeconds)
  const days = Math.floor(absTotalSeconds / 86400)
  const hours = Math.floor((absTotalSeconds % 86400) / 3600)
  const minutes = Math.floor((absTotalSeconds % 3600) / 60)

  const eventIsToday = isToday(eventDate)
  const eventIsTomorrow = isTomorrow(eventDate)
  const label = buildLabel(dateStr, timeStr, { days, isPast, isToday: eventIsToday, isTomorrow: eventIsTomorrow })

  return {
    days,
    hours,
    minutes,
    label,
    isPast,
    isToday: eventIsToday,
    isTomorrow: eventIsTomorrow,
  }
}

/**
 * Returns a human-readable Portuguese countdown label.
 */
export function getCountdownLabel(dateStr: string, timeStr?: string): string {
  const result = getCountdown(dateStr, timeStr)
  return result.label
}

// ─── Label Builder ────────────────────────────────────────────────────────────

function buildLabel(
  dateStr: string,
  timeStr: string | undefined,
  opts: { days: number; isPast: boolean; isToday: boolean; isTomorrow: boolean },
): string {
  const { days, isPast, isToday, isTomorrow } = opts

  if (isToday) return 'Hoje! 🎉'
  if (isTomorrow) return 'Amanhã! 🎶'

  if (isPast) {
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Passou há 1 dia'
    return `Passou há ${days} dias`
  }

  if (days === 1) return 'Falta 1 dia'
  if (days < 7) return `Faltam ${days} dias`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? 'Falta 1 semana' : `Faltam ${weeks} semanas`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? 'Falta 1 mês' : `Faltam ${months} meses`
  }

  const years = Math.floor(days / 365)
  return years === 1 ? 'Falta 1 ano' : `Faltam ${years} anos`
}

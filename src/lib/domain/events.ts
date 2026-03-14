import { parseISO, isValid, isBefore, isAfter, startOfDay, getYear, getMonth } from 'date-fns'
import type { Event, EventFilters } from '@/types'

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseEventDate(event: Event): Date {
  const parsed = parseISO(event.date)
  return isValid(parsed) ? parsed : new Date(0)
}

function today(): Date {
  return startOfDay(new Date())
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

/**
 * Returns a new array of events sorted by date in ascending order.
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort(
    (a, b) => parseEventDate(a).getTime() - parseEventDate(b).getTime(),
  )
}

// ─── Status-based Filters ─────────────────────────────────────────────────────

/**
 * Returns events that are upcoming (date >= today) and not cancelled/wishlist.
 */
export function getUpcomingEvents(events: Event[]): Event[] {
  const todayStart = today()
  return events.filter((e) => {
    if (e.status === 'cancelado' || e.status === 'wishlist') return false
    const date = parseEventDate(e)
    return !isBefore(date, todayStart)
  })
}

/**
 * Returns events whose date is strictly before today and not on wishlist.
 */
export function getPastEvents(events: Event[]): Event[] {
  const todayStart = today()
  return events.filter((e) => {
    if (e.status === 'wishlist') return false
    const date = parseEventDate(e)
    return isBefore(date, todayStart)
  })
}

/**
 * Returns events explicitly marked as 'concluido'.
 */
export function getCompletedEvents(events: Event[]): Event[] {
  return events.filter((e) => e.status === 'concluido')
}

/**
 * Returns events on the wishlist.
 */
export function getWishlistEvents(events: Event[]): Event[] {
  return events.filter((e) => e.status === 'wishlist')
}

/**
 * Returns the single next upcoming event (earliest date >= today) or null.
 */
export function getNextEvent(events: Event[]): Event | null {
  const upcoming = sortEventsByDate(getUpcomingEvents(events))
  return upcoming.length > 0 ? upcoming[0] : null
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

/**
 * Groups events by year-month key ("YYYY-MM").
 */
export function groupEventsByMonth(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>()

  for (const event of events) {
    const key = event.date.slice(0, 7) // "YYYY-MM"
    const existing = map.get(key)
    if (existing) {
      existing.push(event)
    } else {
      map.set(key, [event])
    }
  }

  // Sort entries by key so consumers get chronological order
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

/**
 * Returns all events for a specific year and 1-based month number.
 */
export function getEventsForMonth(events: Event[], year: number, month: number): Event[] {
  const key = `${year}-${String(month).padStart(2, '0')}`
  return events.filter((e) => e.date.startsWith(key))
}

/**
 * Returns a sorted, deduplicated list of "YYYY-MM" strings for all months
 * that have at least one event.
 */
export function getMonthsWithEvents(events: Event[]): string[] {
  const keys = new Set(events.map((e) => e.date.slice(0, 7)))
  return [...keys].sort()
}

/**
 * Returns all 12 "YYYY-MM" strings for the given year.
 */
export function getYearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

// ─── Search & Filter ──────────────────────────────────────────────────────────

/**
 * Case-insensitive full-text search across title, artist, city, state, and venue.
 */
export function searchEvents(events: Event[], query: string): Event[] {
  const q = query.trim().toLowerCase()
  if (!q) return events

  return events.filter((e) => {
    const searchable = [e.title, e.artist, e.city, e.state, e.venue]
      .join(' ')
      .toLowerCase()
    return searchable.includes(q)
  })
}

/**
 * Applies one or more filters to an event list. All active filters must match.
 */
export function filterEvents(events: Event[], filters: EventFilters): Event[] {
  const todayStart = today()

  return events.filter((e) => {
    if (filters.city !== undefined) {
      if (e.city.toLowerCase() !== filters.city.toLowerCase()) return false
    }

    if (filters.type !== undefined) {
      if (e.type !== filters.type) return false
    }

    if (filters.status !== undefined) {
      if (e.status !== filters.status) return false
    }

    if (filters.month !== undefined) {
      if (!e.date.startsWith(filters.month)) return false
    }

    if (filters.upcoming === true) {
      const date = parseEventDate(e)
      if (isBefore(date, todayStart)) return false
      if (e.status === 'cancelado' || e.status === 'wishlist') return false
    }

    if (filters.past === true) {
      const date = parseEventDate(e)
      if (!isBefore(date, todayStart)) return false
      if (e.status === 'wishlist') return false
    }

    return true
  })
}

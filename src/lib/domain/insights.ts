import { parseISO, isValid, isBefore, startOfDay, getYear, getMonth } from 'date-fns'
import type { Event, Expense, ExpenseCategory, YearInsights } from '@/types'
import { getExpensesByCategory } from '@/lib/domain/expenses'

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function isUpcoming(event: Event): boolean {
  if (event.status === 'cancelado' || event.status === 'wishlist') return false
  const date = parseISO(event.date)
  if (!isValid(date)) return false
  return !isBefore(date, startOfDay(new Date()))
}

function isPast(event: Event): boolean {
  if (event.status === 'wishlist') return false
  const date = parseISO(event.date)
  if (!isValid(date)) return false
  return isBefore(date, startOfDay(new Date()))
}

// ─── Year Insights ────────────────────────────────────────────────────────────

/**
 * Generates aggregate insights for a given set of events and expenses.
 * The caller is responsible for pre-filtering to the desired year if needed;
 * alternatively use the yearFilter helper below.
 */
export function generateYearInsights(data: {
  events: Event[]
  expenses: Expense[]
}): YearInsights {
  const { events, expenses } = data

  // ── Event counts ───────────────────────────────────────────────────────────
  const totalEvents = events.length
  const upcomingEvents = events.filter(isUpcoming).length
  const pastEvents = events.filter(isPast).length
  const completedEvents = events.filter((e) => e.status === 'concluido').length

  // ── Total spent ────────────────────────────────────────────────────────────
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)

  // ── Cities visited ─────────────────────────────────────────────────────────
  const citiesVisited = [
    ...new Set(
      events
        .filter((e) => e.status !== 'wishlist' && e.status !== 'cancelado')
        .map((e) => e.city)
        .filter(Boolean),
    ),
  ]

  // ── Most expensive event ───────────────────────────────────────────────────
  const expensesByEventId = new Map<string, number>()
  for (const expense of expenses) {
    expensesByEventId.set(
      expense.eventId,
      (expensesByEventId.get(expense.eventId) ?? 0) + expense.amount,
    )
  }

  let mostExpensiveEvent: { event: Event; total: number } | null = null
  let maxTotal = 0

  for (const [eventId, total] of expensesByEventId.entries()) {
    if (total > maxTotal) {
      const event = events.find((e) => e.id === eventId)
      if (event) {
        maxTotal = total
        mostExpensiveEvent = { event, total }
      }
    }
  }

  // ── Busiest month ──────────────────────────────────────────────────────────
  const eventsByMonth = new Map<string, number>()
  for (const event of events) {
    const key = event.date.slice(0, 7) // "YYYY-MM"
    eventsByMonth.set(key, (eventsByMonth.get(key) ?? 0) + 1)
  }

  let busiestMonth: { month: string; count: number } | null = null
  let maxMonthCount = 0

  for (const [month, count] of eventsByMonth.entries()) {
    if (count > maxMonthCount) {
      maxMonthCount = count
      busiestMonth = { month, count }
    }
  }

  // ── Top expense category ───────────────────────────────────────────────────
  const categoryTotals = getExpensesByCategory(expenses)

  let topExpenseCategory: { category: ExpenseCategory; total: number } | null = null
  let maxCategoryTotal = 0

  for (const [category, total] of Object.entries(categoryTotals) as [ExpenseCategory, number][]) {
    if (total > maxCategoryTotal) {
      maxCategoryTotal = total
      topExpenseCategory = { category, total }
    }
  }

  // topExpenseCategory stays null when there are no expenses (maxCategoryTotal === 0)
  if (maxCategoryTotal === 0) {
    topExpenseCategory = null
  }

  return {
    totalEvents,
    upcomingEvents,
    pastEvents,
    completedEvents,
    totalSpent,
    citiesVisited,
    mostExpensiveEvent,
    busiestMonth,
    topExpenseCategory,
  }
}

// ─── Year-scoped Convenience Wrapper ─────────────────────────────────────────

/**
 * Same as generateYearInsights but automatically filters events and expenses
 * to the specified calendar year.
 */
export function generateYearInsightsForYear(
  year: number,
  data: { events: Event[]; expenses: Expense[] },
): YearInsights {
  const events = data.events.filter((e) => {
    const date = parseISO(e.date)
    return isValid(date) && getYear(date) === year
  })

  const expenses = data.expenses.filter((e) => {
    const date = parseISO(e.expenseDate)
    return isValid(date) && getYear(date) === year
  })

  return generateYearInsights({ events, expenses })
}

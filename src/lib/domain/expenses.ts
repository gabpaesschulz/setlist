import { getYear, getMonth, parseISO, isValid } from 'date-fns'
import type { Expense, Event, ExpenseCategory, Ticket, Travel, Lodging } from '@/types'

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseExpenseDate(expense: Expense): Date | null {
  const date = parseISO(expense.expenseDate)
  return isValid(date) ? date : null
}

function getBudgetStatus(ratio: number): 'ok' | 'warning' | 'critical' | 'over' {
  if (ratio >= 1) return 'over'
  if (ratio >= 0.9) return 'critical'
  if (ratio >= 0.75) return 'warning'
  return 'ok'
}

function calculateProjectedTotal(params: {
  totalSpent: number
  eventDate: string
  expenseDates: string[]
  todayIso?: string
}): number {
  const eventDate = parseISO(params.eventDate)
  if (!isValid(eventDate)) return params.totalSpent

  const today = params.todayIso ? parseISO(params.todayIso) : new Date()
  if (!isValid(today)) return params.totalSpent

  if (today >= eventDate) return params.totalSpent

  const validExpenseDates = params.expenseDates
    .map((date) => parseISO(date))
    .filter((date) => isValid(date) && date <= today)
    .sort((a, b) => a.getTime() - b.getTime())

  if (validExpenseDates.length === 0) return params.totalSpent

  const startDate = validExpenseDates[0]
  const elapsedDays = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / 86400000) + 1)
  const totalWindowDays = Math.max(
    elapsedDays,
    Math.ceil((eventDate.getTime() - startDate.getTime()) / 86400000) + 1,
  )

  return (params.totalSpent / elapsedDays) * totalWindowDays
}

export interface EventBudgetGuardrails {
  summary: {
    budgetTotal: number
    totalSpent: number
    projectedTotal: number
    spentRatio: number
    projectedRatio: number
    remaining: number
    status: 'ok' | 'warning' | 'critical' | 'over'
  }
  categories: Array<{
    category: ExpenseCategory
    budget: number
    spent: number
    ratio: number
    status: 'ok' | 'warning' | 'critical' | 'over'
  }>
  topPressureCategories: ExpenseCategory[]
}

export function getEventBudgetGuardrails(params: {
  budgetTotal?: number
  budgetByCategory?: Partial<Record<ExpenseCategory, number>>
  totalSpent: number
  spentByCategory: Record<ExpenseCategory, number>
  eventDate: string
  expenseDates: string[]
  todayIso?: string
}): EventBudgetGuardrails | null {
  if (!params.budgetTotal || params.budgetTotal <= 0) return null

  const projectedTotal = calculateProjectedTotal({
    totalSpent: params.totalSpent,
    eventDate: params.eventDate,
    expenseDates: params.expenseDates,
    todayIso: params.todayIso,
  })
  const spentRatio = params.totalSpent / params.budgetTotal
  const projectedRatio = projectedTotal / params.budgetTotal
  const spentStatus = getBudgetStatus(spentRatio)
  const projectedStatus = getBudgetStatus(projectedRatio)
  const statusPriority = { ok: 0, warning: 1, critical: 2, over: 3 }
  const status =
    statusPriority[projectedStatus] > statusPriority[spentStatus]
      ? projectedStatus
      : spentStatus

  const categories = Object.entries(params.budgetByCategory ?? {})
    .filter(([, budget]) => typeof budget === 'number' && budget > 0)
    .map(([category, budget]) => {
      const spent = params.spentByCategory[category as ExpenseCategory] ?? 0
      const ratio = spent / (budget as number)
      return {
        category: category as ExpenseCategory,
        budget: budget as number,
        spent,
        ratio,
        status: getBudgetStatus(ratio),
      }
    })
    .sort((a, b) => b.ratio - a.ratio || b.spent - a.spent)

  const topPressureCategories = categories
    .filter((item) => item.ratio >= 0.75)
    .slice(0, 2)
    .map((item) => item.category)

  return {
    summary: {
      budgetTotal: params.budgetTotal,
      totalSpent: params.totalSpent,
      projectedTotal,
      spentRatio,
      projectedRatio,
      remaining: params.budgetTotal - params.totalSpent,
      status,
    },
    categories,
    topPressureCategories,
  }
}

/**
 * Merges manual expenses with automatic expenses derived from Tickets, Travel, and Lodging.
 * This provides a unified view for charts and totals.
 */
export function getAllProjectedExpenses(
  expenses: Expense[],
  tickets: Ticket[],
  travels: Travel[],
  lodgings: Lodging[],
  events: Event[],
): Expense[] {
  const all = [...expenses]
  const eventMap = new Map(events.map((e) => [e.id, e]))

  // 1. Tickets -> 'ingresso'
  for (const t of tickets) {
    const total = (t.price || 0) + (t.fee || 0)
    if (total > 0) {
      const event = eventMap.get(t.eventId)
      all.push({
        id: `ticket-${t.id}`,
        eventId: t.eventId,
        category: 'ingresso',
        amount: total,
        description: 'Ingresso (Calculado)',
        expenseDate: event?.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    }
  }

  // 2. Travel -> 'transporte'
  for (const t of travels) {
    if ((t.price || 0) > 0) {
      const event = eventMap.get(t.eventId)
      // Use outbound date or event date as fallback
      const date = t.outboundDateTime ? t.outboundDateTime.split('T')[0] : event?.date
      all.push({
        id: `travel-${t.id}`,
        eventId: t.eventId,
        category: 'transporte',
        amount: t.price!,
        description: 'Viagem (Calculado)',
        expenseDate: date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    }
  }

  // 3. Lodging -> 'hospedagem'
  for (const l of lodgings) {
    if ((l.price || 0) > 0) {
      const event = eventMap.get(l.eventId)
      const date = l.checkIn ? l.checkIn.split('T')[0] : event?.date
      all.push({
        id: `lodging-${l.id}`,
        eventId: l.eventId,
        category: 'hospedagem',
        amount: l.price!,
        description: 'Hospedagem (Calculado)',
        expenseDate: date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    }
  }

  return all
}

// ─── Per-Event Aggregations ───────────────────────────────────────────────────

/**
 * Returns the sum of all expense amounts for the given expense list.
 */
export function getTotalExpensesForEvent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

// ─── Temporal Aggregations ────────────────────────────────────────────────────

/**
 * Returns the sum of expenses whose expenseDate falls within the given
 * year and 1-based month number.
 */
export function getTotalExpensesForMonth(
  expenses: Expense[],
  year: number,
  month: number,
): number {
  return expenses
    .filter((e) => {
      const date = parseExpenseDate(e)
      if (!date) return false
      return getYear(date) === year && getMonth(date) + 1 === month
    })
    .reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Returns the sum of expenses whose expenseDate falls within the given year.
 */
export function getTotalExpensesForYear(expenses: Expense[], year: number): number {
  return expenses
    .filter((e) => {
      const date = parseExpenseDate(e)
      if (!date) return false
      return getYear(date) === year
    })
    .reduce((sum, e) => sum + e.amount, 0)
}

// ─── Breakdown by Category ────────────────────────────────────────────────────

/**
 * Returns a record mapping each ExpenseCategory to the total amount spent
 * in that category. Categories with no expenses get a total of 0.
 */
export function getExpensesByCategory(expenses: Expense[]): Record<ExpenseCategory, number> {
  const result: Record<ExpenseCategory, number> = {
    ingresso: 0,
    transporte: 0,
    hospedagem: 0,
    alimentacao: 0,
    merch: 0,
    extras: 0,
    outro: 0,
  }

  for (const expense of expenses) {
    result[expense.category] = (result[expense.category] ?? 0) + expense.amount
  }

  return result
}

// ─── Breakdown by Month ───────────────────────────────────────────────────────

/**
 * Returns a record mapping 1-based month numbers (1–12) to total amounts for
 * all expenses in the given year. Months with no expenses have a value of 0.
 */
export function getExpensesByMonth(
  expenses: Expense[],
  year: number,
): Record<number, number> {
  const result: Record<number, number> = {}
  for (let m = 1; m <= 12; m++) {
    result[m] = 0
  }

  for (const expense of expenses) {
    const date = parseExpenseDate(expense)
    if (!date || getYear(date) !== year) continue
    const month = getMonth(date) + 1 // date-fns months are 0-based
    result[month] = (result[month] ?? 0) + expense.amount
  }

  return result
}

// ─── Cross-Event Rankings ─────────────────────────────────────────────────────

/**
 * Returns events sorted by total expenses descending. Each entry includes the
 * event and its summed expense total. Events with no expenses are included
 * with a total of 0.
 */
export function getTopExpenseEvents(
  expenses: Expense[],
  events: Event[],
): Array<{ event: Event; total: number }> {
  // Build a map of eventId → total
  const totalsById = new Map<string, number>()
  for (const expense of expenses) {
    totalsById.set(expense.eventId, (totalsById.get(expense.eventId) ?? 0) + expense.amount)
  }

  return events
    .map((event) => ({ event, total: totalsById.get(event.id) ?? 0 }))
    .sort((a, b) => b.total - a.total)
}

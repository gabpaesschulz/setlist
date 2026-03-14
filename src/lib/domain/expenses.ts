import { getYear, getMonth, parseISO, isValid } from 'date-fns'
import type { Expense, Event, ExpenseCategory } from '@/types'

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseExpenseDate(expense: Expense): Date | null {
  const date = parseISO(expense.expenseDate)
  return isValid(date) ? date : null
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

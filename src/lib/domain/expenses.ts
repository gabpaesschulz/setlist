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

export type EarlyPurchaseScenarioLevel = 'conservador' | 'provavel' | 'otimista'

export type EarlyPurchaseRecommendation = 'comprar_agora' | 'esperar' | 'monitorar'

export interface EarlyPurchaseCategoryInput {
  category: 'ingresso' | 'transporte' | 'hospedagem'
  currentPrice: number
  targetPrice: number
  priceCap: number
  volatility: number
  inventoryRisk: number
}

export interface EarlyPurchaseSimulationParams {
  categories: EarlyPurchaseCategoryInput[]
  daysUntilTarget: number
  budgetTotal?: number
  currentSpent?: number
}

export interface EarlyPurchaseCategorySimulation {
  category: EarlyPurchaseCategoryInput['category']
  currentPrice: number
  priceCap: number
  projected: Record<EarlyPurchaseScenarioLevel, number>
  recommendation: EarlyPurchaseRecommendation
  shouldAlert: boolean
}

export interface EarlyPurchaseSimulationResult {
  totals: Record<EarlyPurchaseScenarioLevel, number>
  categories: EarlyPurchaseCategorySimulation[]
  recommendation: EarlyPurchaseRecommendation
  budgetRisk: 'ok' | 'warning' | 'critical'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Simula cenários de compra antecipada para ingresso, transporte e hospedagem.
 */
export function simulateEarlyPurchaseScenarios(
  params: EarlyPurchaseSimulationParams,
): EarlyPurchaseSimulationResult {
  const daysUntilTarget = clamp(params.daysUntilTarget, 0, 365)
  const timePressure = clamp(daysUntilTarget / 120, 0, 1.5)

  const categories: EarlyPurchaseCategorySimulation[] = params.categories
    .filter(
      (item) =>
        item.currentPrice > 0 &&
        item.targetPrice > 0 &&
        item.priceCap > 0 &&
        Number.isFinite(item.currentPrice) &&
        Number.isFinite(item.targetPrice) &&
        Number.isFinite(item.priceCap),
    )
    .map((item) => {
      const volatility = clamp(item.volatility, 0, 1)
      const inventoryRisk = clamp(item.inventoryRisk, 0, 1)
      const riskPressure = clamp(
        (volatility * 0.6 + inventoryRisk * 0.4) * (0.5 + timePressure),
        0,
        1.8,
      )

      const conservative = roundCurrency(item.currentPrice * (1 + riskPressure * 0.35))
      const probable = roundCurrency(
        item.targetPrice +
          (item.currentPrice - item.targetPrice) * 0.35 +
          item.currentPrice * riskPressure * 0.12,
      )
      const optimistic = roundCurrency(
        Math.max(item.targetPrice * (1 - volatility * 0.08), item.targetPrice * 0.6),
      )

      const shouldBuyNow =
        conservative > item.priceCap || conservative > item.currentPrice * 1.2 || probable > item.priceCap
      const shouldWait = probable <= item.currentPrice * 0.95 && conservative <= item.priceCap
      const recommendation: EarlyPurchaseRecommendation = shouldBuyNow
        ? 'comprar_agora'
        : shouldWait
          ? 'esperar'
          : 'monitorar'

      return {
        category: item.category,
        currentPrice: roundCurrency(item.currentPrice),
        priceCap: roundCurrency(item.priceCap),
        projected: {
          conservador: conservative,
          provavel: roundCurrency(probable),
          otimista: roundCurrency(optimistic),
        },
        recommendation,
        shouldAlert: shouldBuyNow,
      }
    })

  const totals = categories.reduce<Record<EarlyPurchaseScenarioLevel, number>>(
    (acc, item) => ({
      conservador: roundCurrency(acc.conservador + item.projected.conservador),
      provavel: roundCurrency(acc.provavel + item.projected.provavel),
      otimista: roundCurrency(acc.otimista + item.projected.otimista),
    }),
    { conservador: 0, provavel: 0, otimista: 0 },
  )

  const categoriesToBuyNow = categories.filter((item) => item.recommendation === 'comprar_agora').length
  const categoriesToWait = categories.filter((item) => item.recommendation === 'esperar').length
  const recommendation: EarlyPurchaseRecommendation =
    categoriesToBuyNow > 0 ? 'comprar_agora' : categoriesToWait === categories.length ? 'esperar' : 'monitorar'

  const projectedSpent = (params.currentSpent ?? 0) + totals.provavel
  const budgetRatio =
    params.budgetTotal && params.budgetTotal > 0 ? projectedSpent / params.budgetTotal : 0
  const budgetRisk: EarlyPurchaseSimulationResult['budgetRisk'] =
    budgetRatio >= 1 ? 'critical' : budgetRatio >= 0.85 ? 'warning' : 'ok'

  return {
    totals,
    categories,
    recommendation,
    budgetRisk,
  }
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

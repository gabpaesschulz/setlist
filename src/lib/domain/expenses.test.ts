import { describe, expect, it } from 'vitest'
import { getEventBudgetGuardrails } from '@/lib/domain/expenses'
import type { ExpenseCategory } from '@/types'

const emptySpentByCategory: Record<ExpenseCategory, number> = {
  ingresso: 0,
  transporte: 0,
  hospedagem: 0,
  alimentacao: 0,
  merch: 0,
  extras: 0,
  outro: 0,
}

describe('expenses guardrails', () => {
  it('retorna null quando orçamento não existe', () => {
    const result = getEventBudgetGuardrails({
      totalSpent: 500,
      spentByCategory: emptySpentByCategory,
      eventDate: '2026-08-20',
      expenseDates: [],
    })

    expect(result).toBeNull()
  })

  it('sinaliza risco de estouro quando projeção excede orçamento', () => {
    const result = getEventBudgetGuardrails({
      budgetTotal: 1000,
      totalSpent: 400,
      spentByCategory: {
        ...emptySpentByCategory,
        ingresso: 250,
        transporte: 150,
      },
      budgetByCategory: {
        ingresso: 300,
        transporte: 200,
      },
      eventDate: '2026-03-20',
      expenseDates: ['2026-03-01', '2026-03-03', '2026-03-05'],
      todayIso: '2026-03-05',
    })

    expect(result?.summary.status).toBe('over')
    expect(result?.summary.projectedTotal).toBeGreaterThan(result?.summary.budgetTotal ?? 0)
    expect(result?.topPressureCategories).toEqual(['ingresso', 'transporte'])
  })

  it('sinaliza estouro quando gasto atual ultrapassa orçamento', () => {
    const result = getEventBudgetGuardrails({
      budgetTotal: 700,
      totalSpent: 820,
      spentByCategory: {
        ...emptySpentByCategory,
        ingresso: 500,
        hospedagem: 320,
      },
      eventDate: '2026-11-15',
      expenseDates: ['2026-10-01'],
      todayIso: '2026-10-02',
    })

    expect(result?.summary.status).toBe('over')
    expect(result?.summary.remaining).toBeLessThan(0)
    expect(result?.summary.spentRatio).toBeGreaterThan(1)
  })
})

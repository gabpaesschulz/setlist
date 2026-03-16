import { describe, expect, it } from 'vitest'
import { getEventBudgetGuardrails, simulateEarlyPurchaseScenarios } from '@/lib/domain/expenses'
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

describe('early purchase scenarios', () => {
  it('recomenda esperar quando projeção provável é menor e limite é respeitado', () => {
    const result = simulateEarlyPurchaseScenarios({
      daysUntilTarget: 20,
      categories: [
        {
          category: 'ingresso',
          currentPrice: 400,
          targetPrice: 320,
          priceCap: 430,
          volatility: 0.2,
          inventoryRisk: 0.1,
        },
      ],
      budgetTotal: 2500,
      currentSpent: 900,
    })

    expect(result.recommendation).toBe('esperar')
    expect(result.categories[0]?.recommendation).toBe('esperar')
    expect(result.totals.provavel).toBeLessThan(400)
    expect(result.budgetRisk).toBe('ok')
  })

  it('sinaliza compra imediata quando cenário conservador estoura limite', () => {
    const result = simulateEarlyPurchaseScenarios({
      daysUntilTarget: 80,
      categories: [
        {
          category: 'transporte',
          currentPrice: 250,
          targetPrice: 240,
          priceCap: 260,
          volatility: 0.9,
          inventoryRisk: 0.9,
        },
      ],
      budgetTotal: 700,
      currentSpent: 500,
    })

    expect(result.recommendation).toBe('comprar_agora')
    expect(result.categories[0]?.shouldAlert).toBe(true)
    expect(result.categories[0]?.projected.conservador).toBeGreaterThan(260)
    expect(result.budgetRisk).toBe('critical')
  })

  it('ignora categorias inválidas e mantém total zerado', () => {
    const result = simulateEarlyPurchaseScenarios({
      daysUntilTarget: 30,
      categories: [
        {
          category: 'hospedagem',
          currentPrice: 0,
          targetPrice: 300,
          priceCap: 350,
          volatility: 0.4,
          inventoryRisk: 0.5,
        },
      ],
    })

    expect(result.categories).toHaveLength(0)
    expect(result.totals.provavel).toBe(0)
    expect(result.recommendation).toBe('esperar')
  })
})

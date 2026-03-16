import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { AvailabilityRisk, PriceVolatility, PurchaseSimulation } from '@/types'

const volatilityUpFactor: Record<PriceVolatility, number> = {
  baixa: 0.08,
  media: 0.16,
  alta: 0.24,
}

const volatilityDiscountFactor: Record<PriceVolatility, number> = {
  baixa: 0.05,
  media: 0.1,
  alta: 0.16,
}

const availabilityPressure: Record<AvailabilityRisk, number> = {
  baixo: 0.03,
  medio: 0.07,
  alto: 0.12,
}

export interface SimulationProjection {
  conservative: number
  probable: number
  optimistic: number
}

export type SimulationRecommendation = 'comprar_agora' | 'monitorar' | 'esperar_promocao'

export interface SimulationResult {
  simulation: PurchaseSimulation
  projection: SimulationProjection
  recommendation: SimulationRecommendation
  likelySavingsVsNow: number
  budgetRisk: 'ok' | 'alerta'
}

export interface EarlyPurchaseReport {
  totalNow: number
  totalProbable: number
  totalOptimistic: number
  totalConservative: number
  recommendations: Record<SimulationRecommendation, number>
  results: SimulationResult[]
}

/**
 * Calcula cenários de compra antecipada por item e consolida recomendações.
 */
export function getEarlyPurchaseReport(params: {
  simulations: PurchaseSimulation[]
  remainingBudget?: number
  referenceDateIso?: string
}): EarlyPurchaseReport {
  const results = params.simulations.map((simulation) =>
    evaluatePurchaseSimulation({
      simulation,
      remainingBudget: params.remainingBudget,
      referenceDateIso: params.referenceDateIso,
    }),
  )

  return {
    totalNow: results.reduce((sum, item) => sum + item.simulation.currentPrice, 0),
    totalProbable: results.reduce((sum, item) => sum + item.projection.probable, 0),
    totalOptimistic: results.reduce((sum, item) => sum + item.projection.optimistic, 0),
    totalConservative: results.reduce((sum, item) => sum + item.projection.conservative, 0),
    recommendations: {
      comprar_agora: results.filter((item) => item.recommendation === 'comprar_agora').length,
      monitorar: results.filter((item) => item.recommendation === 'monitorar').length,
      esperar_promocao: results.filter((item) => item.recommendation === 'esperar_promocao').length,
    },
    results,
  }
}

/**
 * Avalia um cenário individual comparando compra imediata e espera.
 */
export function evaluatePurchaseSimulation(params: {
  simulation: PurchaseSimulation
  remainingBudget?: number
  referenceDateIso?: string
}): SimulationResult {
  const projection = projectPriceRange(params.simulation, params.referenceDateIso)
  const likelySavingsVsNow = params.simulation.currentPrice - projection.probable
  const recommendation = getRecommendation({
    simulation: params.simulation,
    projection,
    likelySavingsVsNow,
    referenceDateIso: params.referenceDateIso,
  })
  const budgetRisk =
    typeof params.remainingBudget === 'number' && params.remainingBudget >= 0 && projection.probable > params.remainingBudget
      ? 'alerta'
      : 'ok'

  return {
    simulation: params.simulation,
    projection,
    recommendation,
    likelySavingsVsNow,
    budgetRisk,
  }
}

/**
 * Projeta faixa de preço futura em cenários conservador, provável e otimista.
 */
export function projectPriceRange(
  simulation: PurchaseSimulation,
  referenceDateIso?: string,
): SimulationProjection {
  const targetDate = parseISO(simulation.targetDate)
  const referenceDate = referenceDateIso ? parseISO(referenceDateIso) : new Date()
  const daysUntilTarget = Math.max(0, differenceInCalendarDays(targetDate, referenceDate))
  const horizonFactor = Math.min(1.35, 1 + daysUntilTarget / 120)
  const upFactor = volatilityUpFactor[simulation.volatility] * horizonFactor
  const pressure = availabilityPressure[simulation.availabilityRisk]
  const discountFactor = volatilityDiscountFactor[simulation.volatility] * Math.min(1.1, 0.6 + daysUntilTarget / 60)

  const conservative = simulation.targetPrice * (1 + upFactor + pressure)
  const probable = simulation.targetPrice * (1 + upFactor * 0.45 + pressure * 0.5)
  const optimistic = Math.max(
    simulation.targetPrice * 0.4,
    simulation.targetPrice * (1 - discountFactor),
  )

  return { conservative, probable, optimistic }
}

function getRecommendation(params: {
  simulation: PurchaseSimulation
  projection: SimulationProjection
  likelySavingsVsNow: number
  referenceDateIso?: string
}): SimulationRecommendation {
  const referenceDate = params.referenceDateIso ? parseISO(params.referenceDateIso) : new Date()
  const daysUntilTarget = Math.max(0, differenceInCalendarDays(parseISO(params.simulation.targetDate), referenceDate))
  const buyingNowSafer =
    params.simulation.availabilityRisk === 'alto' ||
    params.projection.probable >= params.simulation.currentPrice

  if (buyingNowSafer) return 'comprar_agora'
  if (params.likelySavingsVsNow > params.simulation.currentPrice * 0.08 && daysUntilTarget >= 14) {
    return 'esperar_promocao'
  }
  return 'monitorar'
}

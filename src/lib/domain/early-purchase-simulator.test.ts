import { describe, expect, it } from "vitest";
import type { PurchaseSimulation } from "@/types";
import { evaluatePurchaseSimulation, getEarlyPurchaseReport } from "@/lib/domain/early-purchase-simulator";

const baseSimulation: PurchaseSimulation = {
  id: "sim-1",
  eventId: "event-1",
  category: "ingresso",
  provider: "Sympla",
  currentPrice: 300,
  targetPrice: 280,
  targetDate: "2026-09-10",
  volatility: "media",
  availabilityRisk: "medio",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("early purchase simulator", () => {
  it("recomenda comprar agora quando risco de oferta é alto", () => {
    const result = evaluatePurchaseSimulation({
      simulation: { ...baseSimulation, availabilityRisk: "alto" },
      referenceDateIso: "2026-08-10",
    });

    expect(result.recommendation).toBe("comprar_agora");
    expect(result.projection.conservative).toBeGreaterThan(result.simulation.targetPrice);
  });

  it("recomenda esperar promoção quando há economia provável relevante", () => {
    const result = evaluatePurchaseSimulation({
      simulation: {
        ...baseSimulation,
        currentPrice: 420,
        targetPrice: 260,
        volatility: "baixa",
        availabilityRisk: "baixo",
      },
      referenceDateIso: "2026-07-01",
    });

    expect(result.recommendation).toBe("esperar_promocao");
    expect(result.likelySavingsVsNow).toBeGreaterThan(0);
  });

  it("marca alerta de orçamento quando cenário provável excede limite restante", () => {
    const report = getEarlyPurchaseReport({
      simulations: [baseSimulation, { ...baseSimulation, id: "sim-2", category: "transporte", provider: "Azul", currentPrice: 200, targetPrice: 190 }],
      remainingBudget: 250,
      referenceDateIso: "2026-08-01",
    });

    expect(report.results.some((item) => item.budgetRisk === "alerta")).toBe(true);
    expect(report.totalProbable).toBeGreaterThan(0);
  });
});

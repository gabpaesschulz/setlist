import { beforeEach, describe, expect, it } from "vitest";
import {
  createEvent,
  db,
  deleteEvent,
  exportAllData,
  getPurchaseSimulationsByEventId,
  importAllData,
  resetAllData,
  upsertPurchaseSimulation,
} from "@/lib/db";

describe("purchase simulations persistence integration", () => {
  beforeEach(async () => {
    await resetAllData();
    await db.backups.clear();
  });

  it("persiste e recupera cenários por evento em ordem de data alvo", async () => {
    const event = await createEvent({
      title: "Festival XPTO",
      artist: "Banda X",
      type: "festival",
      status: "ativo",
      date: "2026-10-20",
      city: "São Paulo",
      state: "SP",
      venue: "Autódromo",
    });

    await upsertPurchaseSimulation({
      eventId: event.id,
      category: "ingresso",
      provider: "Sympla",
      currentPrice: 300,
      targetPrice: 270,
      targetDate: "2026-08-20",
      volatility: "media",
      availabilityRisk: "medio",
    });
    await upsertPurchaseSimulation({
      eventId: event.id,
      category: "transporte",
      provider: "Azul",
      currentPrice: 450,
      targetPrice: 390,
      targetDate: "2026-07-10",
      volatility: "alta",
      availabilityRisk: "alto",
    });

    const records = await getPurchaseSimulationsByEventId(event.id);
    expect(records.map((item) => item.targetDate)).toEqual(["2026-07-10", "2026-08-20"]);
  });

  it("mantém contrato de exportação e importação com cenários", async () => {
    const event = await createEvent({
      title: "Show Y",
      artist: "Artista Y",
      type: "show",
      status: "ativo",
      date: "2026-11-15",
      city: "Rio de Janeiro",
      state: "RJ",
      venue: "Arena",
    });

    await upsertPurchaseSimulation({
      eventId: event.id,
      category: "hospedagem",
      provider: "Booking",
      currentPrice: 700,
      targetPrice: 620,
      targetDate: "2026-09-15",
      volatility: "baixa",
      availabilityRisk: "baixo",
    });

    const backup = await exportAllData();
    await resetAllData();
    await importAllData(backup);
    const records = await getPurchaseSimulationsByEventId(event.id);

    expect(records).toHaveLength(1);
    expect(records[0].provider).toBe("Booking");
  });

  it("remove cenários ao excluir evento", async () => {
    const event = await createEvent({
      title: "Show Z",
      artist: "Artista Z",
      type: "show",
      status: "ativo",
      date: "2026-12-01",
      city: "Curitiba",
      state: "PR",
      venue: "Pedreira",
    });

    await upsertPurchaseSimulation({
      eventId: event.id,
      category: "ingresso",
      provider: "Eventim",
      currentPrice: 280,
      targetPrice: 250,
      targetDate: "2026-10-01",
      volatility: "media",
      availabilityRisk: "medio",
    });
    await deleteEvent(event.id);
    const records = await getPurchaseSimulationsByEventId(event.id);

    expect(records).toEqual([]);
  });
});

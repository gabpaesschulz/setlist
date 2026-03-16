import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ItineraryItem, PurchaseSimulation } from "@/types";

const mocks = vi.hoisted(() => ({
  dbUpdateItineraryItem: vi.fn(),
  dbDeleteItineraryItem: vi.fn(),
  dbUpsertPurchaseSimulation: vi.fn(),
  dbDeletePurchaseSimulation: vi.fn(),
  getBackupImportPreview: vi.fn(),
  importDataByEventIds: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getAllEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  upsertTicket: vi.fn(),
  upsertTravel: vi.fn(),
  upsertLodging: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  createItineraryItem: vi.fn(),
  updateItineraryItem: mocks.dbUpdateItineraryItem,
  deleteItineraryItem: mocks.dbDeleteItineraryItem,
  createChecklistItem: vi.fn(),
  updateChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
  upsertReflection: vi.fn(),
  upsertPurchaseSimulation: mocks.dbUpsertPurchaseSimulation,
  deletePurchaseSimulation: mocks.dbDeletePurchaseSimulation,
  seedDemoData: vi.fn(),
  exportAllData: vi.fn(),
  getBackupImportPreview: mocks.getBackupImportPreview,
  importAllData: vi.fn(),
  importDataByEventIds: mocks.importDataByEventIds,
  resetAllData: vi.fn(),
  createEventAuditLog: vi.fn(),
  createAutoBackupSnapshot: vi.fn(),
  listAutoBackupSnapshots: vi.fn(),
  restoreAutoBackupSnapshot: vi.fn(),
  pruneAutoBackupSnapshots: vi.fn(),
  db: {},
}));

import { useEventsStore } from "@/stores/events-store";

describe("useEventsStore itinerary actions", () => {
  const baseItem: ItineraryItem = {
    id: "item-1",
    eventId: "event-1",
    order: 0,
    title: "Check-in",
    description: "Hotel",
    done: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useEventsStore.setState({
      itinerary: [baseItem],
    });
  });

  it("atualiza item de roteiro no estado após persistir", async () => {
    const updatedItem: ItineraryItem = {
      ...baseItem,
      title: "Check-in atualizado",
    };
    mocks.dbUpdateItineraryItem.mockResolvedValue(updatedItem);

    await useEventsStore.getState().updateItineraryItem(baseItem.id, { title: "Check-in atualizado" });

    expect(mocks.dbUpdateItineraryItem).toHaveBeenCalledWith(baseItem.id, { title: "Check-in atualizado" });
    expect(useEventsStore.getState().itinerary).toEqual([updatedItem]);
  });

  it("remove item de roteiro do estado após exclusão", async () => {
    mocks.dbDeleteItineraryItem.mockResolvedValue(undefined);

    await useEventsStore.getState().deleteItineraryItem(baseItem.id);

    expect(mocks.dbDeleteItineraryItem).toHaveBeenCalledWith(baseItem.id);
    expect(useEventsStore.getState().itinerary).toEqual([]);
  });

  it("retorna prévia de importação sem alterar estado", async () => {
    const preview = [
      {
        id: "event-1",
        title: "Festival",
        artist: "Banda X",
        date: "2026-10-10",
        city: "São Paulo",
        venue: "Allianz",
      },
    ];
    mocks.getBackupImportPreview.mockReturnValue(preview);

    const result = await useEventsStore.getState().previewImportData('{"version":1}');

    expect(mocks.getBackupImportPreview).toHaveBeenCalledWith('{"version":1}');
    expect(result).toEqual(preview);
    expect(useEventsStore.getState().loading).toBe(false);
  });

  it("restaura eventos selecionados e recarrega dados", async () => {
    const refreshAllSpy = vi.spyOn(useEventsStore.getState(), "refreshAll").mockResolvedValue(undefined);
    mocks.importDataByEventIds.mockResolvedValue(undefined);

    await useEventsStore.getState().importDataByEvents('{"version":1}', ["event-1", "event-2"]);

    expect(mocks.importDataByEventIds).toHaveBeenCalledWith('{"version":1}', ["event-1", "event-2"]);
    expect(refreshAllSpy).toHaveBeenCalled();
    refreshAllSpy.mockRestore();
  });

  it("persiste cenário de compra antecipada e sincroniza estado", async () => {
    const simulation: PurchaseSimulation = {
      id: "sim-1",
      eventId: "event-1",
      category: "ingresso",
      provider: "Sympla",
      currentPrice: 320,
      targetPrice: 280,
      targetDate: "2026-09-01",
      volatility: "media",
      availabilityRisk: "medio",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    mocks.dbUpsertPurchaseSimulation.mockResolvedValue(simulation);

    await useEventsStore.getState().upsertPurchaseSimulation({
      eventId: simulation.eventId,
      category: simulation.category,
      provider: simulation.provider,
      currentPrice: simulation.currentPrice,
      targetPrice: simulation.targetPrice,
      targetDate: simulation.targetDate,
      volatility: simulation.volatility,
      availabilityRisk: simulation.availabilityRisk,
    });

    expect(mocks.dbUpsertPurchaseSimulation).toHaveBeenCalled();
    expect(useEventsStore.getState().getPurchaseSimulationsByEventId("event-1")).toEqual([simulation]);
  });

  it("remove cenário de compra antecipada após exclusão persistida", async () => {
    useEventsStore.setState({
      purchaseSimulations: [
        {
          id: "sim-1",
          eventId: "event-1",
          category: "ingresso",
          provider: "Sympla",
          currentPrice: 320,
          targetPrice: 280,
          targetDate: "2026-09-01",
          volatility: "media",
          availabilityRisk: "medio",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    mocks.dbDeletePurchaseSimulation.mockResolvedValue(undefined);

    await useEventsStore.getState().deletePurchaseSimulation("sim-1");

    expect(mocks.dbDeletePurchaseSimulation).toHaveBeenCalledWith("sim-1");
    expect(useEventsStore.getState().getPurchaseSimulationsByEventId("event-1")).toEqual([]);
  });
});

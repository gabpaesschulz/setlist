import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ItineraryItem } from "@/types";

const mocks = vi.hoisted(() => ({
  dbUpdateItineraryItem: vi.fn(),
  dbDeleteItineraryItem: vi.fn(),
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
  seedDemoData: vi.fn(),
  exportAllData: vi.fn(),
  importAllData: vi.fn(),
  resetAllData: vi.fn(),
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
});

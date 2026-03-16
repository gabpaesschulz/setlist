import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ItinerarySection } from "@/components/events/itinerary-section";
import type { ItineraryItem } from "@/types";

const mocks = vi.hoisted(() => ({
  addItineraryItem: vi.fn(),
  updateItineraryItem: vi.fn(),
  deleteItineraryItem: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/stores/events-store", () => ({
  useEventsStore: (selector: (store: unknown) => unknown) =>
    selector({
      addItineraryItem: mocks.addItineraryItem,
      updateItineraryItem: mocks.updateItineraryItem,
      deleteItineraryItem: mocks.deleteItineraryItem,
    }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: mocks.toast,
}));

const item: ItineraryItem = {
  id: "item-1",
  eventId: "event-1",
  order: 0,
  title: "Entrada no festival",
  description: "Portão A",
  done: false,
  dateTime: "2026-05-14T18:30",
};

describe("ItinerarySection integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateItineraryItem.mockResolvedValue(undefined);
    mocks.deleteItineraryItem.mockResolvedValue(undefined);
    mocks.addItineraryItem.mockResolvedValue(undefined);
  });

  it("abre ações com swipe e remove item", async () => {
    render(<ItinerarySection eventId="event-1" itinerary={[item]} />);

    const row = screen.getByRole("listitem", { name: /item do roteiro entrada no festival/i });
    expect(row).toHaveStyle({ transform: "translateX(0px)" });

    fireEvent.touchStart(row, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(row, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(row);

    expect(row).toHaveStyle({ transform: "translateX(-144px)" });

    fireEvent.click(screen.getByRole("button", { name: /remover item/i }));

    await waitFor(() => {
      expect(mocks.deleteItineraryItem).toHaveBeenCalledWith(item.id);
    });
    expect(mocks.toast).toHaveBeenCalledWith({ title: "Item removido" });
  });

  it("abre edição por swipe e salva alterações do item", async () => {
    render(<ItinerarySection eventId="event-1" itinerary={[item]} />);

    const row = screen.getByRole("listitem", { name: /item do roteiro entrada no festival/i });
    fireEvent.touchStart(row, { touches: [{ clientX: 220 }] });
    fireEvent.touchMove(row, { touches: [{ clientX: 40 }] });
    fireEvent.touchEnd(row);

    fireEvent.click(screen.getByRole("button", { name: /editar item/i }));

    const titleInput = await screen.findByDisplayValue("Entrada no festival");
    fireEvent.change(titleInput, { target: { value: "Entrada VIP" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(mocks.updateItineraryItem).toHaveBeenCalledWith(item.id, {
        title: "Entrada VIP",
        description: "Portão A",
        dateTime: "2026-05-14T18:30",
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({ title: "Item atualizado no roteiro!" });
  });
});

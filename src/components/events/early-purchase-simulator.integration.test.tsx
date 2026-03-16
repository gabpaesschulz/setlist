import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EarlyPurchaseSimulator } from "@/components/events/early-purchase-simulator";
import type { Event, PurchaseSimulation } from "@/types";

const mocks = vi.hoisted(() => ({
  updateEvent: vi.fn(),
  upsertPurchaseSimulation: vi.fn(),
  deletePurchaseSimulation: vi.fn(),
  toast: vi.fn(),
}));

const baseSimulation: PurchaseSimulation = {
  id: "sim-1",
  eventId: "event-1",
  category: "ingresso",
  provider: "Sympla",
  currentPrice: 420,
  targetPrice: 360,
  targetDate: "2026-04-01",
  volatility: "media",
  availabilityRisk: "medio",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

let purchaseSimulations: PurchaseSimulation[] = [baseSimulation];

vi.mock("@/stores/events-store", () => ({
  useEventsStore: (selector: (store: unknown) => unknown) =>
    selector({
      purchaseSimulations,
      updateEvent: mocks.updateEvent,
      upsertPurchaseSimulation: mocks.upsertPurchaseSimulation,
      deletePurchaseSimulation: mocks.deletePurchaseSimulation,
    }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: mocks.toast,
}));

const event: Event = {
  id: "event-1",
  title: "Show Teste",
  artist: "Banda",
  type: "show",
  status: "ativo",
  date: "2026-05-20",
  city: "São Paulo",
  state: "SP",
  venue: "Arena",
  budgetTotal: 2000,
  purchaseSimulator: {
    targetDate: "2026-04-01",
    limitByCategory: {
      ingresso: 430,
      transporte: 260,
      hospedagem: 300,
    },
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("EarlyPurchaseSimulator integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purchaseSimulations = [baseSimulation];
  });

  it("renderiza cenários e recomendação com base no contrato salvo", () => {
    render(
      <EarlyPurchaseSimulator
        eventId="event-1"
        event={event}
        totalSpent={800}
        ticket={{ id: "ticket-1", eventId: "event-1", sector: "", ticketType: "", purchaseType: "inteira", provider: "Sympla", price: 400, fee: 20, purchased: true }}
      />,
    );

    expect(screen.getByText("Simulador de compra antecipada")).toBeInTheDocument();
    expect(screen.getByText("Cenários salvos")).toBeInTheDocument();
    expect(screen.getByText(/Recomendação:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Provável/i).length).toBeGreaterThan(0);
  });

  it("persiste configuração e cenário via ações de store", async () => {
    const user = userEvent.setup();
    render(
      <EarlyPurchaseSimulator
        eventId="event-1"
        event={event}
        totalSpent={800}
        ticket={{ id: "ticket-1", eventId: "event-1", sector: "", ticketType: "", purchaseType: "inteira", provider: "Sympla", price: 400, fee: 20, purchased: true }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Salvar configuração/i }));
    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalled());

    await user.clear(screen.getByLabelText("Fornecedor"));
    await user.type(screen.getByLabelText("Fornecedor"), "Azul");
    await user.click(screen.getByRole("button", { name: /Salvar cenário/i }));

    await waitFor(() => expect(mocks.upsertPurchaseSimulation).toHaveBeenCalled());
  });

  it("remove cenário e mostra estado sem dados quando não há base de custo", async () => {
    const user = userEvent.setup();
    const view = render(<EarlyPurchaseSimulator eventId="event-1" event={event} totalSpent={0} />);

    await user.click(screen.getByRole("button", { name: "Remover cenário" }));
    await waitFor(() => expect(mocks.deletePurchaseSimulation).toHaveBeenCalledWith("sim-1"));

    purchaseSimulations = [];
    view.rerender(<EarlyPurchaseSimulator eventId="event-1" event={event} totalSpent={0} />);
    expect(screen.getByText("Sem dados suficientes para simular")).toBeInTheDocument();
  });


  it("remove cenário salvo e chama ação de exclusão", async () => {
    const user = userEvent.setup();
    render(
      <EarlyPurchaseSimulator
        eventId="event-1"
        event={event}
        totalSpent={800}
        ticket={{ id: "ticket-1", eventId: "event-1", sector: "", ticketType: "", purchaseType: "inteira", provider: "Sympla", price: 400, fee: 20, purchased: true }}
      />,
    );

    await user.click(screen.getByLabelText("Remover cenário"));

    await waitFor(() => {
      expect(mocks.deletePurchaseSimulation).toHaveBeenCalledWith("sim-1");
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Cenário removido" }));
    });
  });

  it("exibe fallback e erro de persistência quando configuração falha", async () => {
    const user = userEvent.setup();
    purchaseSimulations = [];
    mocks.updateEvent.mockRejectedValueOnce(new Error("falha"));

    render(
      <EarlyPurchaseSimulator
        eventId="event-1"
        event={event}
        totalSpent={0}
      />,
    );

    expect(screen.getByText("Sem dados suficientes para simular")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Salvar configuração/i }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Não foi possível salvar a configuração",
          variant: "destructive",
        }),
      );
    });
  });

  it("exibe erro ao falhar salvar e remover cenário", async () => {
    const user = userEvent.setup();
    mocks.upsertPurchaseSimulation.mockRejectedValueOnce(new Error("falha"));
    mocks.deletePurchaseSimulation.mockRejectedValueOnce(new Error("falha"));

    render(
      <EarlyPurchaseSimulator
        eventId="event-1"
        event={event}
        totalSpent={800}
        ticket={{ id: "ticket-1", eventId: "event-1", sector: "", ticketType: "", purchaseType: "inteira", provider: "Sympla", price: 400, fee: 20, purchased: true }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Salvar cenário/i }));
    await user.click(screen.getByLabelText("Remover cenário"));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Erro ao salvar cenário", variant: "destructive" }),
      );
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Erro ao remover cenário", variant: "destructive" }),
      );
    });
  });
});

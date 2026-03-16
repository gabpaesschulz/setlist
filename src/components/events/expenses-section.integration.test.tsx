import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpensesSection } from "@/components/events/expenses-section";
import type { Event, Expense } from "@/types";

const mocks = vi.hoisted(() => ({
  deleteExpense: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/stores/events-store", () => ({
  useEventsStore: (selector: (store: unknown) => unknown) =>
    selector({
      deleteExpense: mocks.deleteExpense,
      addExpense: vi.fn(),
    }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: mocks.toast,
}));

const baseEvent: Event = {
  id: "event-1",
  title: "Festival XPTO",
  artist: "Banda Y",
  type: "festival",
  status: "ativo",
  date: "2026-03-20",
  city: "São Paulo",
  state: "SP",
  venue: "Autódromo",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const expenses: Expense[] = [
  {
    id: "expense-1",
    eventId: "event-1",
    category: "alimentacao",
    amount: 120,
    description: "Lanches",
    expenseDate: "2026-03-02",
    createdAt: "2026-03-02T10:00:00.000Z",
  },
];

describe("ExpensesSection integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe alerta preditivo quando orçamento está em risco", () => {
    render(
      <ExpensesSection
        eventId="event-1"
        event={{
          ...baseEvent,
          budgetTotal: 600,
          budgetByCategory: {
            ingresso: 250,
            transporte: 100,
          },
        }}
        expenses={expenses}
        ticket={{ id: "ticket-1", eventId: "event-1", sector: "", ticketType: "", purchaseType: "inteira", provider: "", price: 250, fee: 20, purchased: true }}
        travel={{ id: "travel-1", eventId: "event-1", transportType: "onibus", booked: true, departureLocation: "", arrivalLocation: "", price: 90 }}
      />,
    );

    expect(screen.getByText("Guardrail de orçamento")).toBeInTheDocument();
    expect(screen.getByText("Risco alto de estouro")).toBeInTheDocument();
    expect(screen.getByText(/Maior pressão: ingresso e transporte\./i)).toBeInTheDocument();
  });

  it("não exibe guardrail quando evento não possui orçamento", () => {
    render(<ExpensesSection eventId="event-1" event={baseEvent} expenses={expenses} />);

    expect(screen.queryByText("Guardrail de orçamento")).not.toBeInTheDocument();
  });
});

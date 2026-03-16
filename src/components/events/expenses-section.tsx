"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, TrendingUp, Ticket, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, Expense, ExpenseCategory, Ticket as TicketType, Travel } from "@/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useEventsStore } from "@/stores/events-store";
import { getEventBudgetGuardrails } from "@/lib/domain/expenses";
import { EarlyPurchaseSimulator } from "@/components/events/early-purchase-simulator";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────

const expenseFormSchema = z.object({
  category: z.enum(["ingresso", "transporte", "hospedagem", "alimentacao", "merch", "extras", "outro"]),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  description: z.string().min(1, "Descrição é obrigatória"),
  expenseDate: z
    .string()
    .min(1, "Data é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExpensesSectionProps {
  eventId: string;
  event?: Event;
  expenses: Expense[];
  ticket?: TicketType;
  travel?: Travel;
  lodging?: { price?: number };
}

// ─── Category color map ───────────────────────────────────────────────────────

const categoryBgColor: Record<ExpenseCategory, string> = {
  ingresso: "bg-purple-500/10",
  transporte: "bg-blue-500/10",
  hospedagem: "bg-indigo-500/10",
  alimentacao: "bg-orange-500/10",
  merch: "bg-pink-500/10",
  extras: "bg-teal-500/10",
  outro: "bg-gray-500/10",
};

// ─── Add Expense Form ─────────────────────────────────────────────────────────

function AddExpenseForm({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const addExpense = useEventsStore((s) => s.addExpense);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "outro",
      amount: 0,
      description: "",
      expenseDate: today,
    },
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true);
    try {
      await addExpense({
        eventId,
        category: data.category,
        amount: data.amount,
        description: data.description,
        expenseDate: data.expenseDate,
      });
      toast({ title: "Gasto adicionado!" });
      onClose();
    } catch {
      toast({ title: "Erro ao adicionar gasto", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Novo gasto</h4>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs">Categoria</Label>
        <Select defaultValue="outro" onValueChange={(v) => setValue("category", v as ExpenseFormValues["category"])}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.icon} {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-xs">Valor (R$) *</Label>
          <Input
            {...register("amount", { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            className="h-9 text-sm"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label className="text-xs">Data *</Label>
          <Input {...register("expenseDate")} type="date" className="h-9 text-sm" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs">Descrição *</Label>
        <Input {...register("description")} placeholder="Ex: Ingresso setor A" className="h-9 text-sm" />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <Button type="submit" className="w-full rounded-xl h-9" disabled={loading}>
        {loading ? "Adicionando..." : "Adicionar gasto"}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExpensesSection({ eventId, event, expenses, ticket, travel, lodging }: ExpensesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteExpense = useEventsStore((s) => s.deleteExpense);

  const ticketCost = (ticket?.price ?? 0) + (ticket?.fee ?? 0);
  const travelCost = travel?.price ?? 0;
  const lodgingCost = lodging?.price ?? 0;
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const total = expensesTotal + ticketCost + travelCost + lodgingCost;

  // Group by category
  const grouped = expenses.reduce<Record<ExpenseCategory, Expense[]>>(
    (acc, expense) => {
      const cat = expense.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(expense);
      return acc;
    },
    {} as Record<ExpenseCategory, Expense[]>,
  );

  const categoryTotals = Object.entries(grouped)
    .map(([cat, items]) => ({
      category: cat as ExpenseCategory,
      total: items.reduce((sum, e) => sum + e.amount, 0),
      count: items.length,
    }))
    .sort((a, b) => b.total - a.total);

  const spentByCategory: Record<ExpenseCategory, number> = {
    ingresso: ticketCost,
    transporte: travelCost,
    hospedagem: lodgingCost,
    alimentacao: 0,
    merch: 0,
    extras: 0,
    outro: 0,
  };
  for (const expense of expenses) {
    spentByCategory[expense.category] += expense.amount;
  }

  const budgetGuardrails =
    event?.budgetTotal && event.date
      ? getEventBudgetGuardrails({
          budgetTotal: event.budgetTotal,
          budgetByCategory: event.budgetByCategory,
          totalSpent: total,
          spentByCategory,
          eventDate: event.date,
          expenseDates: expenses.map((expense) => expense.expenseDate),
        })
      : null;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast({ title: "Gasto removido" });
    } catch {
      toast({ title: "Erro ao remover gasto", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Total banner */}
      {(expenses.length > 0 || total > 0) && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Total gasto</p>
              <p className="text-2xl font-black text-primary">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {expenses.length} {expenses.length === 1 ? "item manual" : "itens manuais"}
                {ticketCost > 0 || travelCost > 0 ? " + custos fixos" : ""}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Category breakdown */}
          {categoryTotals.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryTotals.map(({ category, total: catTotal }) => {
                const meta = EXPENSE_CATEGORIES[category];
                return (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-xs font-medium"
                  >
                    <span>{meta.icon}</span>
                    <span>{formatCurrency(catTotal)}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {budgetGuardrails && (
        <div
          className={cn(
            "rounded-2xl border px-4 py-4",
            budgetGuardrails.summary.status === "over" && "border-destructive/40 bg-destructive/5",
            budgetGuardrails.summary.status === "critical" && "border-amber-400/40 bg-amber-500/5",
            budgetGuardrails.summary.status === "warning" && "border-yellow-400/40 bg-yellow-500/5",
            budgetGuardrails.summary.status === "ok" && "border-emerald-400/40 bg-emerald-500/5",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Guardrail de orçamento</p>
              <p className="text-sm font-semibold text-foreground">
                {budgetGuardrails.summary.status === "over" && "Orçamento estourado"}
                {budgetGuardrails.summary.status === "critical" && "Risco alto de estouro"}
                {budgetGuardrails.summary.status === "warning" && "Atenção ao ritmo de gastos"}
                {budgetGuardrails.summary.status === "ok" && "Orçamento sob controle"}
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {Math.round(budgetGuardrails.summary.projectedRatio * 100)}% projetado
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              Gasto atual:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(budgetGuardrails.summary.totalSpent)}
              </span>
            </p>
            <p>
              Orçamento planejado:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(budgetGuardrails.summary.budgetTotal)}
              </span>
            </p>
            <p>
              Projeção até o evento:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(budgetGuardrails.summary.projectedTotal)}
              </span>
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/70">
            <div
              className={cn(
                "h-full",
                budgetGuardrails.summary.status === "over" && "bg-destructive",
                budgetGuardrails.summary.status === "critical" && "bg-amber-500",
                budgetGuardrails.summary.status === "warning" && "bg-yellow-500",
                budgetGuardrails.summary.status === "ok" && "bg-emerald-500",
              )}
              style={{ width: `${Math.min(100, Math.max(4, budgetGuardrails.summary.spentRatio * 100))}%` }}
            />
          </div>

          {budgetGuardrails.topPressureCategories.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Maior pressão:{" "}
              {budgetGuardrails.topPressureCategories
                .map((category) => EXPENSE_CATEGORIES[category].label.toLowerCase())
                .join(" e ")}
              .
            </p>
          )}
        </div>
      )}

      {event && (
        <EarlyPurchaseSimulator
          eventId={eventId}
          event={event}
          ticket={ticket}
          travel={travel}
          lodging={lodging}
          totalSpent={total}
        />
      )}

      {/* Add form */}
      {showForm && <AddExpenseForm eventId={eventId} onClose={() => setShowForm(false)} />}

      {/* Fixed costs (Ticket & Travel) */}
      {(ticketCost > 0 || travelCost > 0 || lodgingCost > 0) && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground/80">Custos Fixos</span>
            </div>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(ticketCost + travelCost + lodgingCost)}
            </span>
          </div>

          <div className="divide-y divide-border/40">
            {ticketCost > 0 && (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <Ticket className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Ingresso + Taxas</span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(ticketCost)}</span>
              </div>
            )}
            {travelCost > 0 && (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <Bus className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Viagem</span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(travelCost)}</span>
              </div>
            )}
            {lodgingCost > 0 && (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                    <span className="text-xs">🏨</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Hospedagem</span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(lodgingCost)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expense list grouped by category */}
      {Object.entries(grouped).map(([cat, items]) => {
        const catMeta = EXPENSE_CATEGORIES[cat as ExpenseCategory];
        const catTotal = items.reduce((sum, e) => sum + e.amount, 0);

        return (
          <div key={cat} className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-sm",
                    categoryBgColor[cat as ExpenseCategory],
                  )}
                >
                  {catMeta.icon}
                </div>
                <span className="text-xs font-semibold text-foreground/80">{catMeta.label}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{formatCurrency(catTotal)}</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/40">
              {items.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(expense.expenseDate)}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground flex-shrink-0 tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-all active:scale-90 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    aria-label="Remover gasto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {expenses.length === 0 && !showForm && total === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
          <div className="text-3xl">💸</div>
          <p className="text-sm font-semibold text-foreground">Nenhum gasto registrado</p>
          <p className="text-xs text-muted-foreground">Adicione seus gastos para controlar o orçamento</p>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card py-3 text-sm font-semibold text-muted-foreground transition-all active:scale-[0.98] hover:bg-muted/30"
        >
          <Plus className="h-4 w-4" />
          Adicionar gasto
        </button>
      )}
    </div>
  );
}

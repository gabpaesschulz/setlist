"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Sparkles, Trash2 } from "lucide-react";
import type { Event, PurchaseSimulation, Ticket, Travel } from "@/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import {
  simulateEarlyPurchaseScenarios,
  type EarlyPurchaseCategoryInput,
  type EarlyPurchaseRecommendation,
} from "@/lib/domain/expenses";
import { useEventsStore } from "@/stores/events-store";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EarlyPurchaseSimulatorProps {
  eventId: string;
  event: Event;
  ticket?: Ticket;
  travel?: Travel;
  lodging?: { price?: number };
  totalSpent: number;
}

type SimulationCategory = "ingresso" | "transporte" | "hospedagem";

const volatilityWeight: Record<PurchaseSimulation["volatility"], number> = {
  baixa: 0.25,
  media: 0.5,
  alta: 0.8,
};

const availabilityWeight: Record<PurchaseSimulation["availabilityRisk"], number> = {
  baixo: 0.25,
  medio: 0.5,
  alto: 0.85,
};

const recommendationLabel: Record<EarlyPurchaseRecommendation, string> = {
  comprar_agora: "Comprar agora",
  esperar: "Esperar",
  monitorar: "Monitorar diariamente",
};

function toIsoDate(value?: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}

function getDaysUntil(targetDate: string): number {
  const today = new Date();
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  const diff = target.getTime() - new Date(today.toDateString()).getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function EarlyPurchaseSimulator({
  eventId,
  event,
  ticket,
  travel,
  lodging,
  totalSpent,
}: EarlyPurchaseSimulatorProps) {
  const purchaseSimulations = useEventsStore((state) =>
    state.purchaseSimulations
      .filter((item) => item.eventId === eventId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
  const upsertPurchaseSimulation = useEventsStore((state) => state.upsertPurchaseSimulation);
  const deletePurchaseSimulation = useEventsStore((state) => state.deletePurchaseSimulation);
  const updateEvent = useEventsStore((state) => state.updateEvent);

  const baseCurrentPrice: Record<SimulationCategory, number> = {
    ingresso: (ticket?.price ?? 0) + (ticket?.fee ?? 0),
    transporte: travel?.price ?? 0,
    hospedagem: lodging?.price ?? 0,
  };

  const configuredTargetDate = toIsoDate(event.purchaseSimulator?.targetDate || event.date);
  const [targetDate, setTargetDate] = useState(configuredTargetDate);
  const [limits, setLimits] = useState<Record<SimulationCategory, number>>({
    ingresso:
      event.purchaseSimulator?.limitByCategory?.ingresso ?? Math.max(1, Math.round(baseCurrentPrice.ingresso || 400)),
    transporte:
      event.purchaseSimulator?.limitByCategory?.transporte ??
      Math.max(1, Math.round(baseCurrentPrice.transporte || 250)),
    hospedagem:
      event.purchaseSimulator?.limitByCategory?.hospedagem ?? Math.max(1, Math.round(baseCurrentPrice.hospedagem || 300)),
  });

  const [draft, setDraft] = useState<Omit<PurchaseSimulation, "id" | "eventId" | "createdAt" | "updatedAt">>({
    category: "ingresso",
    provider: "Planejado",
    currentPrice: Math.max(1, baseCurrentPrice.ingresso || 300),
    targetPrice: Math.max(1, Math.round((baseCurrentPrice.ingresso || 300) * 0.9)),
    targetDate,
    volatility: "media",
    availabilityRisk: "medio",
  });
  const [saving, setSaving] = useState(false);

  const latestByCategory = useMemo(() => {
    const map = new Map<SimulationCategory, PurchaseSimulation>();
    for (const simulation of purchaseSimulations) {
      if (!map.has(simulation.category)) {
        map.set(simulation.category, simulation);
      }
    }
    return map;
  }, [purchaseSimulations]);

  const categoriesToSimulate = useMemo<EarlyPurchaseCategoryInput[]>(() => {
    const categories: SimulationCategory[] = ["ingresso", "transporte", "hospedagem"];
    return categories
      .map((category) => {
        const simulation = latestByCategory.get(category);
        const current = simulation?.currentPrice ?? baseCurrentPrice[category];
        const target = simulation?.targetPrice ?? Math.max(current * 0.9, 1);
        const cap = limits[category] > 0 ? limits[category] : Math.max(current, 1);
        if (current <= 0) return null;
        return {
          category,
          currentPrice: current,
          targetPrice: target,
          priceCap: cap,
          volatility: volatilityWeight[simulation?.volatility ?? "media"],
          inventoryRisk: availabilityWeight[simulation?.availabilityRisk ?? "medio"],
        };
      })
      .filter((item): item is EarlyPurchaseCategoryInput => Boolean(item));
  }, [baseCurrentPrice, latestByCategory, limits]);

  const simulationResult = useMemo(() => {
    if (categoriesToSimulate.length === 0) return null;
    return simulateEarlyPurchaseScenarios({
      categories: categoriesToSimulate,
      daysUntilTarget: getDaysUntil(targetDate),
      budgetTotal: event.budgetTotal,
      currentSpent: totalSpent,
    });
  }, [categoriesToSimulate, event.budgetTotal, targetDate, totalSpent]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await updateEvent(eventId, {
        purchaseSimulator: {
          targetDate,
          limitByCategory: limits,
        },
      });
      toast({ title: "Configuração do simulador salva" });
    } catch {
      toast({ title: "Não foi possível salvar a configuração", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    try {
      await upsertPurchaseSimulation({
        ...draft,
        eventId,
        targetDate,
      });
      toast({ title: "Cenário salvo com sucesso" });
    } catch {
      toast({ title: "Erro ao salvar cenário", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      await deletePurchaseSimulation(id);
      toast({ title: "Cenário removido" });
    } catch {
      toast({ title: "Erro ao remover cenário", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Simulador de compra antecipada</h3>
          <p className="text-xs text-muted-foreground">
            Compare comprar agora vs esperar em cenários conservador, provável e otimista.
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Data alvo de compra</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleSaveConfig} disabled={saving} variant="outline" className="h-9 w-full">
            <CalendarClock className="h-4 w-4 mr-2" />
            Salvar configuração
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {(["ingresso", "transporte", "hospedagem"] as SimulationCategory[]).map((category) => (
          <div key={category} className="grid grid-cols-[1fr_120px] gap-3 items-end">
            <div>
              <Label className="text-xs">{EXPENSE_CATEGORIES[category].label}</Label>
              <p className="text-xs text-muted-foreground">Preço limite aceitável</p>
            </div>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={limits[category]}
              onChange={(event) =>
                setLimits((prev) => ({ ...prev, [category]: Number(event.target.value || 0) }))
              }
              className="h-9 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/50 p-3 space-y-3">
        <p className="text-xs font-semibold text-foreground">Adicionar cenário</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select
              value={draft.category}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, category: value as SimulationCategory }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingresso">Ingresso</SelectItem>
                <SelectItem value="transporte">Transporte</SelectItem>
                <SelectItem value="hospedagem">Hospedagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="early-purchase-provider">Fornecedor</Label>
            <Input
              id="early-purchase-provider"
              value={draft.provider}
              onChange={(event) => setDraft((prev) => ({ ...prev, provider: event.target.value }))}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Preço atual</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={draft.currentPrice}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, currentPrice: Number(event.target.value || 0) }))
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço esperado</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={draft.targetPrice}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, targetPrice: Number(event.target.value || 0) }))
              }
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Volatilidade</Label>
            <Select
              value={draft.volatility}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, volatility: value as PurchaseSimulation["volatility"] }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Risco de disponibilidade</Label>
            <Select
              value={draft.availabilityRisk}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, availabilityRisk: value as PurchaseSimulation["availabilityRisk"] }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSaveScenario} className="w-full h-9" disabled={saving}>
          Salvar cenário
        </Button>
      </div>

      {purchaseSimulations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Cenários salvos</p>
          {purchaseSimulations.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {EXPENSE_CATEGORIES[item.category].label} · {item.provider}
                </p>
                <p className="text-xs text-muted-foreground">
                  Atual {formatCurrency(item.currentPrice)} → Esperado {formatCurrency(item.targetPrice)}
                </p>
              </div>
              <button
                aria-label="Remover cenário"
                onClick={() => handleDeleteScenario(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {simulationResult ? (
        <div className="space-y-3 rounded-xl border border-border/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Resultado da simulação</p>
            <p className="text-xs text-muted-foreground">Recomendação: {recommendationLabel[simulationResult.recommendation]}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-[11px] text-muted-foreground">Conservador</p>
              <p className="text-sm font-semibold">{formatCurrency(simulationResult.totals.conservador)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-[11px] text-muted-foreground">Provável</p>
              <p className="text-sm font-semibold">{formatCurrency(simulationResult.totals.provavel)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-[11px] text-muted-foreground">Otimista</p>
              <p className="text-sm font-semibold">{formatCurrency(simulationResult.totals.otimista)}</p>
            </div>
          </div>

          {simulationResult.categories.map((item) => (
            <div key={item.category} className="rounded-lg border border-border/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{EXPENSE_CATEGORIES[item.category].label}</p>
                <p className="text-xs text-muted-foreground">Limite {formatCurrency(item.priceCap)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Provável {formatCurrency(item.projected.provavel)} · Conservador {formatCurrency(item.projected.conservador)}
              </p>
              <div className="mt-1 text-xs flex items-center gap-1">
                {item.shouldAlert ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span>Risco de ultrapassar limite</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Cenário dentro do limite</span>
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
            {simulationResult.budgetRisk === "critical" && "A espera compromete o orçamento total do evento."}
            {simulationResult.budgetRisk === "warning" && "A simulação indica risco moderado para o orçamento total."}
            {simulationResult.budgetRisk === "ok" && "A simulação está aderente ao orçamento total planejado."}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center">
          <p className="text-sm font-medium">Sem dados suficientes para simular</p>
          <p className="text-xs text-muted-foreground">
            Adicione ao menos um cenário com preço atual acima de zero.
          </p>
        </div>
      )}
    </div>
  );
}

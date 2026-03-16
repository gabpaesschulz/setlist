"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Clock3, Sparkles, Trash2 } from "lucide-react";
import type { PurchaseSimulation, Ticket, Travel } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { getEarlyPurchaseReport } from "@/lib/domain/early-purchase-simulator";
import { useEventsStore } from "@/stores/events-store";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const purchaseSimulationSchema = z.object({
  category: z.enum(["ingresso", "transporte", "hospedagem"]),
  provider: z.string().min(1, "Fornecedor é obrigatório"),
  currentPrice: z.coerce.number().min(0.01, "Preço atual deve ser maior que zero"),
  targetPrice: z.coerce.number().min(0.01, "Preço alvo deve ser maior que zero"),
  targetDate: z.string().min(1, "Data alvo é obrigatória"),
  volatility: z.enum(["baixa", "media", "alta"]),
  availabilityRisk: z.enum(["baixo", "medio", "alto"]),
});

type PurchaseSimulationFormValues = z.infer<typeof purchaseSimulationSchema>;

const categoryLabel = {
  ingresso: "Ingresso",
  transporte: "Transporte",
  hospedagem: "Hospedagem",
} as const;

const recommendationLabel = {
  comprar_agora: "Comprar agora",
  monitorar: "Monitorar preço",
  esperar_promocao: "Esperar promoção",
} as const;

interface EarlyPurchaseSimulatorCardProps {
  eventId: string;
  eventDate: string;
  budgetRemaining?: number;
  ticket?: Ticket;
  travel?: Travel;
}

function getDefaultPrice(category: PurchaseSimulationFormValues["category"], ticket?: Ticket, travel?: Travel): number {
  if (category === "ingresso") return (ticket?.price ?? 0) + (ticket?.fee ?? 0);
  if (category === "transporte") return travel?.price ?? 0;
  return 0;
}

export function EarlyPurchaseSimulatorCard({
  eventId,
  eventDate,
  budgetRemaining,
  ticket,
  travel,
}: EarlyPurchaseSimulatorCardProps) {
  const upsertPurchaseSimulation = useEventsStore((s) => s.upsertPurchaseSimulation);
  const deletePurchaseSimulation = useEventsStore((s) => s.deletePurchaseSimulation);
  const simulations = useEventsStore((s) => s.getPurchaseSimulationsByEventId(eventId));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultCurrentPrice = getDefaultPrice("ingresso", ticket, travel);
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PurchaseSimulationFormValues>({
    resolver: zodResolver(purchaseSimulationSchema),
    defaultValues: {
      category: "ingresso",
      provider: "",
      currentPrice: defaultCurrentPrice > 0 ? defaultCurrentPrice : 0,
      targetPrice: defaultCurrentPrice > 0 ? defaultCurrentPrice : 0,
      targetDate: eventDate,
      volatility: "media",
      availabilityRisk: "medio",
    },
  });

  const watchedCategory = watch("category");
  const report = useMemo(
    () =>
      getEarlyPurchaseReport({
        simulations,
        remainingBudget: budgetRemaining,
      }),
    [budgetRemaining, simulations],
  );

  const onCategoryChange = (category: PurchaseSimulationFormValues["category"]) => {
    setValue("category", category);
    const nextPrice = getDefaultPrice(category, ticket, travel);
    if (nextPrice > 0) {
      setValue("currentPrice", nextPrice);
      setValue("targetPrice", nextPrice);
    }
  };

  const onSubmit = async (values: PurchaseSimulationFormValues) => {
    setSaving(true);
    try {
      await upsertPurchaseSimulation({
        eventId,
        category: values.category,
        provider: values.provider,
        currentPrice: values.currentPrice,
        targetPrice: values.targetPrice,
        targetDate: values.targetDate,
        volatility: values.volatility,
        availabilityRisk: values.availabilityRisk,
      });
      toast({ title: "Cenário salvo no simulador" });
      reset({
        category: values.category,
        provider: "",
        currentPrice: values.currentPrice,
        targetPrice: values.targetPrice,
        targetDate: values.targetDate,
        volatility: values.volatility,
        availabilityRisk: values.availabilityRisk,
      });
    } catch {
      toast({ title: "Erro ao salvar cenário", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePurchaseSimulation(id);
      toast({ title: "Cenário removido" });
    } catch {
      toast({ title: "Erro ao remover cenário", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Simulador de compra antecipada</p>
          <p className="text-sm font-semibold text-foreground">Comprar agora vs esperar</p>
        </div>
        <Sparkles className="h-5 w-5 text-primary" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select defaultValue="ingresso" onValueChange={(value) => onCategoryChange(value as PurchaseSimulationFormValues["category"])}>
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
            <Label className="text-xs">Fornecedor</Label>
            <Input {...register("provider")} className="h-9 text-sm" placeholder="Ex: Sympla, Azul, Booking" />
            {errors.provider && <p className="text-xs text-destructive">{errors.provider.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Preço atual</Label>
            <Input {...register("currentPrice")} type="number" step="0.01" min="0.01" className="h-9 text-sm" />
            {errors.currentPrice && <p className="text-xs text-destructive">{errors.currentPrice.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço alvo</Label>
            <Input {...register("targetPrice")} type="number" step="0.01" min="0.01" className="h-9 text-sm" />
            {errors.targetPrice && <p className="text-xs text-destructive">{errors.targetPrice.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Data alvo</Label>
            <Input {...register("targetDate")} type="date" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Volatilidade</Label>
            <Select defaultValue="media" onValueChange={(value) => setValue("volatility", value as PurchaseSimulation["volatility"])}>
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
            <Label className="text-xs">Risco oferta</Label>
            <Select defaultValue="medio" onValueChange={(value) => setValue("availabilityRisk", value as PurchaseSimulation["availabilityRisk"])}>
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

        {watchedCategory === "hospedagem" && (
          <p className="text-xs text-muted-foreground">
            Dica: use um preço alvo com cancelamento grátis para reduzir risco de alta.
          </p>
        )}

        <Button type="submit" className="w-full h-9" disabled={saving}>
          {saving ? "Salvando cenário..." : "Salvar cenário"}
        </Button>
      </form>

      {simulations.length > 0 && (
        <div className="space-y-2">
          <div className="rounded-xl border border-border/50 px-3 py-2 bg-muted/20">
            <p className="text-xs text-muted-foreground">Resumo provável</p>
            <p className="text-sm font-semibold text-foreground">
              Agora {formatCurrency(report.totalNow)} · Esperando {formatCurrency(report.totalProbable)}
            </p>
            <p className="text-xs text-muted-foreground">
              {report.recommendations.comprar_agora} para comprar agora · {report.recommendations.esperar_promocao} para esperar
            </p>
          </div>

          {report.results.map((result) => (
            <div key={result.simulation.id} className="rounded-xl border border-border/50 px-3 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {categoryLabel[result.simulation.category]} · {result.simulation.provider}
                  </p>
                  <p className="text-xs text-muted-foreground">Alvo em {result.simulation.targetDate}</p>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(result.simulation.id)}
                  disabled={deletingId === result.simulation.id}
                  aria-label="Remover cenário"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                <p>Conservador: <span className="font-semibold text-foreground">{formatCurrency(result.projection.conservative)}</span></p>
                <p>Provável: <span className="font-semibold text-foreground">{formatCurrency(result.projection.probable)}</span></p>
                <p>Otimista: <span className="font-semibold text-foreground">{formatCurrency(result.projection.optimistic)}</span></p>
                <p>Economia provável: <span className="font-semibold text-foreground">{formatCurrency(result.likelySavingsVsNow)}</span></p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Clock3 className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{recommendationLabel[result.recommendation]}</span>
                {result.budgetRisk === "alerta" && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> risco no orçamento
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

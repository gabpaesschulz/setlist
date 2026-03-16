"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, Clock, CheckCircle2, Circle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { useEventsStore } from "@/stores/events-store";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const itineraryFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().max(1000).optional(),
  dateTime: z.string().optional(),
});

type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

interface ItinerarySectionProps {
  eventId: string;
  itinerary: ItineraryItem[];
}

function AddItineraryForm({
  eventId,
  nextOrder,
  onClose,
}: {
  eventId: string;
  nextOrder: number;
  onClose: () => void;
}) {
  const addItineraryItem = useEventsStore((s) => s.addItineraryItem);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dateTime: "",
    },
  });

  const onSubmit = async (data: ItineraryFormValues) => {
    setLoading(true);
    try {
      await addItineraryItem({
        eventId,
        order: nextOrder,
        title: data.title,
        description: data.description || undefined,
        dateTime: data.dateTime || undefined,
        done: false,
      });
      toast({ title: "Item adicionado ao roteiro!" });
      onClose();
    } catch {
      toast({ title: "Erro ao adicionar item", variant: "destructive" });
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
        <h4 className="text-sm font-semibold text-foreground">Novo item do roteiro</h4>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Título *</Label>
        <Input {...register("title")} placeholder="Ex: Chegada no aeroporto" className="h-9 text-sm" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Data e horário</Label>
        <Input {...register("dateTime")} type="datetime-local" className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          {...register("description")}
          placeholder="Detalhes opcionais..."
          rows={2}
          className="text-sm resize-none"
        />
      </div>

      <Button type="submit" className="w-full rounded-xl h-9" disabled={loading}>
        {loading ? "Adicionando..." : "Adicionar ao roteiro"}
      </Button>
    </form>
  );
}

function EditItineraryForm({ item, onCancel }: { item: ItineraryItem; onCancel: () => void }) {
  const updateItineraryItem = useEventsStore((s) => s.updateItineraryItem);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      title: item.title,
      description: item.description ?? "",
      dateTime: item.dateTime ?? "",
    },
  });

  const onSubmit = async (data: ItineraryFormValues) => {
    setLoading(true);
    try {
      await updateItineraryItem(item.id, {
        title: data.title,
        description: data.description || undefined,
        dateTime: data.dateTime || undefined,
      });
      toast({ title: "Item atualizado no roteiro!" });
      onCancel();
    } catch {
      toast({ title: "Erro ao atualizar item", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-3"
    >
      <div className="space-y-1.5">
        <Label className="text-xs">Título *</Label>
        <Input {...register("title")} placeholder="Ex: Chegada no aeroporto" className="h-9 text-sm" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Data e horário</Label>
        <Input {...register("dateTime")} type="datetime-local" className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          {...register("description")}
          placeholder="Detalhes opcionais..."
          rows={2}
          className="text-sm resize-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" className="h-8 rounded-lg px-3 text-xs" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ItineraryItemRow({ item }: { item: ItineraryItem }) {
  const updateItineraryItem = useEventsStore((s) => s.updateItineraryItem);
  const deleteItineraryItem = useEventsStore((s) => s.deleteItineraryItem);
  const [isEditing, setIsEditing] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const ACTION_WIDTH = 144;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await updateItineraryItem(item.id, { done: !item.done });
    } catch {
      toast({ title: "Erro ao atualizar item", variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  const openActions = () => {
    setIsActionsOpen(true);
    setSwipeOffset(-ACTION_WIDTH);
  };

  const closeActions = () => {
    setIsActionsOpen(false);
    setSwipeOffset(0);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setIsSwiping(false);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartX.current;
    const delta = currentX - touchStartX.current;
    const nextOffset = isActionsOpen ? delta - ACTION_WIDTH : delta;
    const clamped = Math.min(0, Math.max(-ACTION_WIDTH, nextOffset));
    if (Math.abs(clamped - (isActionsOpen ? -ACTION_WIDTH : 0)) > 6) {
      setIsSwiping(true);
    }
    setSwipeOffset(clamped);
  };

  const handleTouchEnd = () => {
    const shouldOpen = swipeOffset <= -ACTION_WIDTH / 2;
    if (shouldOpen) {
      openActions();
    } else {
      closeActions();
    }
    touchStartX.current = null;
    setIsSwiping(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItineraryItem(item.id);
      toast({ title: "Item removido" });
    } catch {
      toast({ title: "Erro ao remover item", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border-b border-border/40 last:border-0">
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 flex w-36">
          <button
            onClick={() => {
              setIsEditing(true);
              closeActions();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 bg-amber-500/90 text-[11px] font-semibold text-amber-950"
            aria-label="Editar item"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-1.5 bg-destructive text-[11px] font-semibold text-destructive-foreground disabled:opacity-40"
            aria-label="Remover item"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        </div>

        <div
          className={cn(
            "flex items-start gap-3 bg-card px-4 py-3.5 transition-transform duration-200",
            item.done && "opacity-60",
            isSwiping && "transition-none",
          )}
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (isActionsOpen && !isSwiping) {
              closeActions();
            }
          }}
          role="listitem"
          aria-label={`Item do roteiro ${item.title}`}
        >
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
            {item.dateTime ? (
              <div className="flex flex-col items-center">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatDateTime(item.dateTime).split(" às ")[1] || formatDateTime(item.dateTime)}
                </span>
              </div>
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-border mt-2" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-semibold text-foreground leading-tight",
                item.done && "line-through text-muted-foreground",
              )}
            >
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
            )}
            {item.dateTime && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDateTime(item.dateTime)}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={(event) => {
                event.stopPropagation();
                void handleToggle();
              }}
              disabled={toggling}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-muted disabled:opacity-30"
              aria-label={item.done ? "Marcar como pendente" : "Marcar como feito"}
            >
              {item.done ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              ) : (
                <Circle className="h-4.5 w-4.5 text-muted-foreground/50" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-card px-4 pb-3.5">
          <EditItineraryForm
            item={item}
            onCancel={() => {
              setIsEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ItinerarySection({ eventId, itinerary }: ItinerarySectionProps) {
  const [showForm, setShowForm] = useState(false);

  const sorted = [...itinerary].sort((a, b) => {
    if (a.dateTime && b.dateTime) return a.dateTime.localeCompare(b.dateTime);
    if (a.dateTime) return -1;
    if (b.dateTime) return 1;
    return a.order - b.order;
  });

  const doneCount = itinerary.filter((i) => i.done).length;

  return (
    <div className="space-y-3">
      {showForm && (
        <AddItineraryForm eventId={eventId} nextOrder={itinerary.length} onClose={() => setShowForm(false)} />
      )}

      {sorted.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
            <span className="text-xs font-semibold text-foreground/70">
              {doneCount}/{sorted.length} concluídos
            </span>
            <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${sorted.length > 0 ? (doneCount / sorted.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {sorted.map((item) => (
            <ItineraryItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {itinerary.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
          <div className="text-3xl">🗓️</div>
          <p className="text-sm font-semibold text-foreground">Nenhum item no roteiro</p>
          <p className="text-xs text-muted-foreground">Planeje cada momento do seu evento</p>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card py-3 text-sm font-semibold text-muted-foreground transition-all active:scale-[0.98] hover:bg-muted/30"
        >
          <Plus className="h-4 w-4" />
          Adicionar ao roteiro
        </button>
      )}
    </div>
  );
}

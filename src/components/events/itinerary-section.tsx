'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, X, Clock, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItineraryItem } from '@/types';
import { formatDateTime } from '@/lib/formatters';
import { useEventsStore } from '@/stores/events-store';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── Schema ───────────────────────────────────────────────────────────────────

const itineraryFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(1000).optional(),
  dateTime: z.string().optional(),
});

type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ItinerarySectionProps {
  eventId: string;
  itinerary: ItineraryItem[];
}

// ─── Add Item Form ────────────────────────────────────────────────────────────

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
      title: '',
      description: '',
      dateTime: '',
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
      toast({ title: 'Item adicionado ao roteiro!' });
      onClose();
    } catch {
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
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
        <Input {...register('title')} placeholder="Ex: Chegada no aeroporto" className="h-9 text-sm" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Data e horário</Label>
        <Input {...register('dateTime')} type="datetime-local" className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          {...register('description')}
          placeholder="Detalhes opcionais..."
          rows={2}
          className="text-sm resize-none"
        />
      </div>

      <Button type="submit" className="w-full rounded-xl h-9" disabled={loading}>
        {loading ? 'Adicionando...' : 'Adicionar ao roteiro'}
      </Button>
    </form>
  );
}

// ─── Itinerary Item Row ───────────────────────────────────────────────────────

function ItineraryItemRow({ item }: { item: ItineraryItem }) {
  const updateItineraryItem = useEventsStore((s) => s.updateItineraryItem);
  const deleteItineraryItem = useEventsStore((s) => s.deleteItineraryItem);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await updateItineraryItem(item.id, { done: !item.done });
    } catch {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItineraryItem(item.id);
      toast({ title: 'Item removido' });
    } catch {
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 border-b border-border/40 last:border-0',
        item.done && 'opacity-60',
      )}
    >
      {/* Left: time indicator */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
        {item.dateTime ? (
          <div className="flex flex-col items-center">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums whitespace-nowrap">
              {formatDateTime(item.dateTime).split(' às ')[1] || formatDateTime(item.dateTime)}
            </span>
          </div>
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-border mt-2" />
        )}
      </div>

      {/* Center: content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold text-foreground leading-tight',
            item.done && 'line-through text-muted-foreground',
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

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-muted disabled:opacity-30"
          aria-label={item.done ? 'Marcar como pendente' : 'Marcar como feito'}
        >
          {item.done ? (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          ) : (
            <Circle className="h-4.5 w-4.5 text-muted-foreground/50" />
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-all active:scale-90 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
          aria-label="Remover item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ItinerarySection({ eventId, itinerary }: ItinerarySectionProps) {
  const [showForm, setShowForm] = useState(false);

  const sorted = [...itinerary].sort((a, b) => {
    // Sort by datetime if present, otherwise by order
    if (a.dateTime && b.dateTime) return a.dateTime.localeCompare(b.dateTime);
    if (a.dateTime) return -1;
    if (b.dateTime) return 1;
    return a.order - b.order;
  });

  const doneCount = itinerary.filter((i) => i.done).length;

  return (
    <div className="space-y-3">
      {/* Add form */}
      {showForm && (
        <AddItineraryForm
          eventId={eventId}
          nextOrder={itinerary.length}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* List */}
      {sorted.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          {/* Progress header */}
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

          {/* Items */}
          {sorted.map((item) => (
            <ItineraryItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {itinerary.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
          <div className="text-3xl">🗓️</div>
          <p className="text-sm font-semibold text-foreground">Nenhum item no roteiro</p>
          <p className="text-xs text-muted-foreground">Planeje cada momento do seu evento</p>
        </div>
      )}

      {/* Add button */}
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

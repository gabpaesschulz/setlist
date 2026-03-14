'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Hotel,
  Plus,
  ExternalLink,
  Pencil,
  MapPin,
  X,
  CheckCircle2,
  Clock,
  BanknoteIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lodging } from '@/types';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useEventsStore } from '@/stores/events-store';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Schema ───────────────────────────────────────────────────────────────────

const lodgingFormSchema = z.object({
  required: z.boolean(),
  name: z.string().optional(),
  address: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  confirmed: z.boolean(),
  bookingUrl: z.string().optional(),
  notes: z.string().optional(),
});

type LodgingFormValues = z.infer<typeof lodgingFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface LodgingSectionProps {
  eventId: string;
  lodging?: Lodging;
}

// ─── Lodging Form ─────────────────────────────────────────────────────────────

function LodgingForm({
  eventId,
  lodging,
  onClose,
}: {
  eventId: string;
  lodging?: Lodging;
  onClose: () => void;
}) {
  const upsertLodging = useEventsStore((s) => s.upsertLodging);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LodgingFormValues>({
    resolver: zodResolver(lodgingFormSchema),
    defaultValues: {
      required: lodging?.required ?? true,
      name: lodging?.name ?? '',
      address: lodging?.address ?? '',
      checkIn: lodging?.checkIn ?? '',
      checkOut: lodging?.checkOut ?? '',
      price: lodging?.price ?? undefined,
      confirmed: lodging?.confirmed ?? false,
      bookingUrl: lodging?.bookingUrl ?? '',
      notes: lodging?.notes ?? '',
    },
  });

  const required = watch('required');
  const confirmed = watch('confirmed');

  const onSubmit = async (data: LodgingFormValues) => {
    setLoading(true);
    try {
      await upsertLodging({
        ...(lodging ? { id: lodging.id } : {}),
        eventId,
        required: data.required,
        name: data.name || undefined,
        address: data.address || undefined,
        checkIn: data.checkIn || undefined,
        checkOut: data.checkOut || undefined,
        price: data.price,
        confirmed: data.confirmed,
        bookingUrl: data.bookingUrl || undefined,
        notes: data.notes || undefined,
      });
      toast({ title: lodging ? 'Hospedagem atualizada!' : 'Hospedagem adicionada!' });
      onClose();
    } catch {
      toast({ title: 'Erro ao salvar hospedagem', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          {lodging ? 'Editar Hospedagem' : 'Adicionar Hospedagem'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Required toggle */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
        <button
          type="button"
          onClick={() => setValue('required', !required)}
          className={cn(
            'flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200',
            required ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        >
          <div
            className={cn(
              'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
              required ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">Hospedagem necessária</p>
          <p className="text-xs text-muted-foreground">Desative se for voltar no mesmo dia</p>
        </div>
      </div>

      {required && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do local</Label>
            <Input {...register('name')} placeholder="Hotel, Airbnb..." className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Endereço</Label>
            <Input {...register('address')} placeholder="Rua, número, bairro..." className="h-9 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Check-in</Label>
              <Input {...register('checkIn')} type="date" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Check-out</Label>
              <Input {...register('checkOut')} type="date" className="h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Diária (R$)</Label>
            <Input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Link da reserva</Label>
            <Input {...register('bookingUrl')} type="url" placeholder="https://..." className="h-9 text-sm" />
          </div>

          {/* Confirmed toggle */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <button
              type="button"
              onClick={() => setValue('confirmed', !confirmed)}
              className={cn(
                'flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200',
                confirmed ? 'bg-emerald-500' : 'bg-muted-foreground/30',
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  confirmed ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">Reserva confirmada</p>
              <p className="text-xs text-muted-foreground">Marque quando a hospedagem for garantida</p>
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full rounded-xl" disabled={loading}>
        {loading ? 'Salvando...' : lodging ? 'Salvar alterações' : 'Adicionar hospedagem'}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LodgingSection({ eventId, lodging }: LodgingSectionProps) {
  const [editing, setEditing] = useState(false);

  if (editing || !lodging) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <LodgingForm
          eventId={eventId}
          lodging={lodging}
          onClose={() => setEditing(false)}
        />
      </div>
    );
  }

  // Not required case
  if (!lodging.required) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Hotel className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Hospedagem</p>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Não necessária
              </span>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
            aria-label="Editar hospedagem"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10">
            <Hotel className="h-4 w-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {lodging.name || 'Hospedagem'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              lodging.confirmed
                ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20',
            )}
          >
            {lodging.confirmed ? (
              <><CheckCircle2 className="h-3 w-3" />Confirmada</>
            ) : (
              <><Clock className="h-3 w-3" />Pendente</>
            )}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
            aria-label="Editar hospedagem"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-1">
        {/* Address */}
        {lodging.address && (
          <div className="flex items-start gap-2 py-2.5 border-b border-border/40">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm text-foreground leading-snug">{lodging.address}</p>
          </div>
        )}

        {/* Check-in / Check-out */}
        {(lodging.checkIn || lodging.checkOut) && (
          <div className="flex items-center justify-between py-2.5 border-b border-border/40">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Check-in</p>
              <p className="text-sm font-bold text-foreground">
                {lodging.checkIn ? formatDate(lodging.checkIn) : '—'}
              </p>
            </div>
            <div className="h-px flex-1 mx-4 bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Check-out</p>
              <p className="text-sm font-bold text-foreground">
                {lodging.checkOut ? formatDate(lodging.checkOut) : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Price per night */}
        {lodging.price !== undefined && lodging.price > 0 && (
          <div className="flex items-center justify-between py-2.5 border-b border-border/40">
            <div className="flex items-center gap-1.5">
              <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Diária</span>
            </div>
            <span className="text-sm font-bold text-foreground">{formatCurrency(lodging.price)}</span>
          </div>
        )}

        {/* Booking URL */}
        {lodging.bookingUrl && (
          <div className="py-2.5">
            <a
              href={lodging.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary active:opacity-70"
            >
              <ExternalLink className="h-4 w-4" />
              Ver reserva
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function LodgingEmptyState({ eventId }: { eventId: string }) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <LodgingForm
          eventId={eventId}
          onClose={() => setAdding(false)}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-5 text-left transition-all active:scale-[0.98] hover:bg-muted/30"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
        <Plus className="h-5 w-5 text-indigo-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Adicionar hospedagem</p>
        <p className="text-xs text-muted-foreground">Hotel, Airbnb ou não necessária</p>
      </div>
    </button>
  );
}

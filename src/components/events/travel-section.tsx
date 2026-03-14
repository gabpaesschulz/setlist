'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  ArrowRight,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Travel } from '@/types';
import { TRANSPORT_TYPES } from '@/lib/constants';
import { formatDateTime } from '@/lib/formatters';
import { useEventsStore } from '@/stores/events-store';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Schema ───────────────────────────────────────────────────────────────────

const travelFormSchema = z.object({
  transportType: z.enum(['onibus', 'excursao', 'aviao', 'carro', 'carona', 'trem', 'outro']),
  company: z.string().optional(),
  booked: z.boolean(),
  departureLocation: z.string().min(1, 'Local de partida é obrigatório'),
  arrivalLocation: z.string().min(1, 'Local de chegada é obrigatório'),
  outboundDateTime: z.string().optional(),
  returnDateTime: z.string().optional(),
  locatorCode: z.string().optional(),
  notes: z.string().optional(),
  bookingUrl: z.string().optional(),
});

type TravelFormValues = z.infer<typeof travelFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TravelSectionProps {
  eventId: string;
  travel?: Travel;
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all active:scale-90"
      aria-label="Copiar"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ─── Travel Form ──────────────────────────────────────────────────────────────

function TravelForm({
  eventId,
  travel,
  onClose,
}: {
  eventId: string;
  travel?: Travel;
  onClose: () => void;
}) {
  const upsertTravel = useEventsStore((s) => s.upsertTravel);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TravelFormValues>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      transportType: travel?.transportType ?? 'onibus',
      company: travel?.company ?? '',
      booked: travel?.booked ?? false,
      departureLocation: travel?.departureLocation ?? '',
      arrivalLocation: travel?.arrivalLocation ?? '',
      outboundDateTime: travel?.outboundDateTime ?? '',
      returnDateTime: travel?.returnDateTime ?? '',
      locatorCode: travel?.locatorCode ?? '',
      notes: travel?.notes ?? '',
      bookingUrl: travel?.bookingUrl ?? '',
    },
  });

  const booked = watch('booked');

  const onSubmit = async (data: TravelFormValues) => {
    setLoading(true);
    try {
      await upsertTravel({
        ...(travel ? { id: travel.id } : {}),
        eventId,
        transportType: data.transportType,
        company: data.company || undefined,
        booked: data.booked,
        departureLocation: data.departureLocation,
        arrivalLocation: data.arrivalLocation,
        outboundDateTime: data.outboundDateTime || undefined,
        returnDateTime: data.returnDateTime || undefined,
        locatorCode: data.locatorCode || undefined,
        notes: data.notes || undefined,
        bookingUrl: data.bookingUrl || undefined,
      });
      toast({ title: travel ? 'Transporte atualizado!' : 'Transporte adicionado!' });
      onClose();
    } catch {
      toast({ title: 'Erro ao salvar transporte', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          {travel ? 'Editar Transporte' : 'Adicionar Transporte'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Transport type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo *</Label>
          <Select
            defaultValue={travel?.transportType ?? 'onibus'}
            onValueChange={(v) => setValue('transportType', v as TravelFormValues['transportType'])}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRANSPORT_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.icon} {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label className="text-xs">Empresa / Operadora</Label>
          <Input {...register('company')} placeholder="Azul, Gol..." className="h-9 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Departure */}
        <div className="space-y-1.5">
          <Label className="text-xs">Saída *</Label>
          <Input {...register('departureLocation')} placeholder="São Paulo - SP" className="h-9 text-sm" />
          {errors.departureLocation && (
            <p className="text-xs text-destructive">{errors.departureLocation.message}</p>
          )}
        </div>

        {/* Arrival */}
        <div className="space-y-1.5">
          <Label className="text-xs">Chegada *</Label>
          <Input {...register('arrivalLocation')} placeholder="Rio de Janeiro - RJ" className="h-9 text-sm" />
          {errors.arrivalLocation && (
            <p className="text-xs text-destructive">{errors.arrivalLocation.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Outbound datetime */}
        <div className="space-y-1.5">
          <Label className="text-xs">Ida (data/hora)</Label>
          <Input {...register('outboundDateTime')} type="datetime-local" className="h-9 text-sm" />
        </div>

        {/* Return datetime */}
        <div className="space-y-1.5">
          <Label className="text-xs">Volta (data/hora)</Label>
          <Input {...register('returnDateTime')} type="datetime-local" className="h-9 text-sm" />
        </div>
      </div>

      {/* Locator code */}
      <div className="space-y-1.5">
        <Label className="text-xs">Código do localizador</Label>
        <Input {...register('locatorCode')} placeholder="ABC123" className="h-9 text-sm font-mono" />
      </div>

      {/* Booking URL */}
      <div className="space-y-1.5">
        <Label className="text-xs">Link da reserva</Label>
        <Input {...register('bookingUrl')} type="url" placeholder="https://..." className="h-9 text-sm" />
      </div>

      {/* Booked toggle */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
        <button
          type="button"
          onClick={() => setValue('booked', !booked)}
          className={cn(
            'flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200',
            booked ? 'bg-emerald-500' : 'bg-muted-foreground/30',
          )}
        >
          <div
            className={cn(
              'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
              booked ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">Transporte reservado</p>
          <p className="text-xs text-muted-foreground">Marque quando a reserva for confirmada</p>
        </div>
      </div>

      <Button type="submit" className="w-full rounded-xl" disabled={loading}>
        {loading ? 'Salvando...' : travel ? 'Salvar alterações' : 'Adicionar transporte'}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TravelSection({ eventId, travel }: TravelSectionProps) {
  const [editing, setEditing] = useState(false);

  if (editing || !travel) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <TravelForm
          eventId={eventId}
          travel={travel}
          onClose={() => setEditing(false)}
        />
      </div>
    );
  }

  const typeMeta = TRANSPORT_TYPES[travel.transportType];

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
            {typeMeta.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {typeMeta.label}
            </h3>
            {travel.company && (
              <p className="text-xs text-muted-foreground">{travel.company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              travel.booked
                ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20',
            )}
          >
            {travel.booked ? (
              <><CheckCircle2 className="h-3 w-3" />Reservado</>
            ) : (
              <><Clock className="h-3 w-3" />Pendente</>
            )}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
            aria-label="Editar transporte"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Route visualization */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Saída</p>
            <p className="text-sm font-bold text-foreground">{travel.departureLocation}</p>
            {travel.outboundDateTime && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(travel.outboundDateTime)}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowRight className="h-5 w-5" />
          </div>

          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Chegada</p>
            <p className="text-sm font-bold text-foreground">{travel.arrivalLocation}</p>
            {travel.returnDateTime && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Volta: {formatDateTime(travel.returnDateTime)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Extra details */}
      <div className="px-4 py-1">
        {/* Locator code */}
        {travel.locatorCode && (
          <div className="flex items-center justify-between gap-2 py-2.5 border-b border-border/40">
            <span className="text-xs font-medium text-muted-foreground">Localizador</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-foreground tracking-widest">
                {travel.locatorCode}
              </span>
              <CopyButton text={travel.locatorCode} />
            </div>
          </div>
        )}

        {/* Booking URL */}
        {travel.bookingUrl && (
          <div className="py-2.5">
            <a
              href={travel.bookingUrl}
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

export function TravelEmptyState({ eventId }: { eventId: string }) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <TravelForm
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
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
        🚌
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Adicionar informações de viagem</p>
        <p className="text-xs text-muted-foreground">Transporte, horários e localizador</p>
      </div>
    </button>
  );
}

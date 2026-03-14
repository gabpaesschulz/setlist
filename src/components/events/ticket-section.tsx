'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ticket as TicketType } from '@/types';
import { PURCHASE_TYPES, TICKET_PROVIDERS } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';
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

const ticketFormSchema = z.object({
  sector: z.string().min(1, 'Setor é obrigatório'),
  ticketType: z.string().min(1, 'Tipo é obrigatório'),
  purchaseType: z.enum(['inteira', 'meia', 'social', 'cortesia', 'outro']),
  provider: z.string().min(1, 'Fornecedor é obrigatório'),
  price: z.coerce.number().min(0, 'Preço inválido'),
  fee: z.coerce.number().min(0, 'Taxa inválida'),
  purchased: z.boolean(),
  orderCode: z.string().optional(),
  ticketUrl: z.string().optional(),
  notes: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TicketSectionProps {
  eventId: string;
  ticket?: TicketType;
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
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all active:scale-90 hover:bg-muted/80"
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

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-2 py-2.5 border-b border-border/40 last:border-0', className)}>
      <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

// ─── Ticket Form ──────────────────────────────────────────────────────────────

function TicketForm({
  eventId,
  ticket,
  onClose,
}: {
  eventId: string;
  ticket?: TicketType;
  onClose: () => void;
}) {
  const upsertTicket = useEventsStore((s) => s.upsertTicket);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      sector: ticket?.sector ?? '',
      ticketType: ticket?.ticketType ?? '',
      purchaseType: ticket?.purchaseType ?? 'inteira',
      provider: ticket?.provider ?? 'Eventim',
      price: ticket?.price ?? 0,
      fee: ticket?.fee ?? 0,
      purchased: ticket?.purchased ?? false,
      orderCode: ticket?.orderCode ?? '',
      ticketUrl: ticket?.ticketUrl ?? '',
      notes: ticket?.notes ?? '',
    },
  });

  const purchased = watch('purchased');

  const onSubmit = async (data: TicketFormValues) => {
    setLoading(true);
    try {
      await upsertTicket({
        ...(ticket ? { id: ticket.id } : {}),
        eventId,
        sector: data.sector,
        ticketType: data.ticketType,
        purchaseType: data.purchaseType,
        provider: data.provider,
        price: data.price,
        fee: data.fee,
        purchased: data.purchased,
        orderCode: data.orderCode || undefined,
        ticketUrl: data.ticketUrl || undefined,
        notes: data.notes || undefined,
      });
      toast({ title: ticket ? 'Ingresso atualizado!' : 'Ingresso adicionado!', description: 'Dados do ingresso salvos com sucesso.' });
      onClose();
    } catch {
      toast({ title: 'Erro ao salvar ingresso', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          {ticket ? 'Editar Ingresso' : 'Adicionar Ingresso'}
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
        {/* Sector */}
        <div className="space-y-1.5">
          <Label className="text-xs">Setor *</Label>
          <Input {...register('sector')} placeholder="Pista, Camarote..." className="h-9 text-sm" />
          {errors.sector && <p className="text-xs text-destructive">{errors.sector.message}</p>}
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo *</Label>
          <Input {...register('ticketType')} placeholder="VIP, Normal..." className="h-9 text-sm" />
          {errors.ticketType && <p className="text-xs text-destructive">{errors.ticketType.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Purchase type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Modalidade</Label>
          <Select
            defaultValue={ticket?.purchaseType ?? 'inteira'}
            onValueChange={(v) => setValue('purchaseType', v as TicketFormValues['purchaseType'])}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PURCHASE_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Provider */}
        <div className="space-y-1.5">
          <Label className="text-xs">Fornecedor *</Label>
          <Select
            defaultValue={ticket?.provider ?? 'Eventim'}
            onValueChange={(v) => setValue('provider', v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICKET_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Price */}
        <div className="space-y-1.5">
          <Label className="text-xs">Valor (R$)</Label>
          <Input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="h-9 text-sm"
          />
        </div>

        {/* Fee */}
        <div className="space-y-1.5">
          <Label className="text-xs">Taxa (R$)</Label>
          <Input
            {...register('fee', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Order code */}
      <div className="space-y-1.5">
        <Label className="text-xs">Código do pedido</Label>
        <Input {...register('orderCode')} placeholder="ABC-123456" className="h-9 text-sm" />
      </div>

      {/* Ticket URL */}
      <div className="space-y-1.5">
        <Label className="text-xs">Link do ingresso</Label>
        <Input {...register('ticketUrl')} type="url" placeholder="https://..." className="h-9 text-sm" />
      </div>

      {/* Purchased toggle */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
        <button
          type="button"
          onClick={() => setValue('purchased', !purchased)}
          className={cn(
            'flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200',
            purchased ? 'bg-emerald-500' : 'bg-muted-foreground/30',
          )}
        >
          <div
            className={cn(
              'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
              purchased ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">Ingresso comprado</p>
          <p className="text-xs text-muted-foreground">Marque quando efetuar a compra</p>
        </div>
      </div>

      <Button type="submit" className="w-full rounded-xl" disabled={loading}>
        {loading ? 'Salvando...' : ticket ? 'Salvar alterações' : 'Adicionar ingresso'}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TicketSection({ eventId, ticket }: TicketSectionProps) {
  const [editing, setEditing] = useState(false);

  const total = ticket ? ticket.price + ticket.fee : 0;

  if (editing || !ticket) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <TicketForm
          eventId={eventId}
          ticket={ticket}
          onClose={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10">
            <Ticket className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Ingresso</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              ticket.purchased
                ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20',
            )}
          >
            {ticket.purchased ? (
              <><CheckCircle2 className="h-3 w-3" />Comprado</>
            ) : (
              <><Clock className="h-3 w-3" />Pendente</>
            )}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground active:scale-90"
            aria-label="Editar ingresso"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-1">
        <InfoRow label="Setor" value={ticket.sector} />
        <InfoRow label="Tipo" value={ticket.ticketType} />
        <InfoRow label="Modalidade" value={PURCHASE_TYPES[ticket.purchaseType].label} />
        <InfoRow label="Fornecedor" value={ticket.provider} />

        {/* Price breakdown */}
        <div className="py-3 border-b border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Valor</span>
            <span>{formatCurrency(ticket.price)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
            <span>Taxa</span>
            <span>{formatCurrency(ticket.fee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-lg font-black text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Order code */}
        {ticket.orderCode && (
          <div className="flex items-center justify-between gap-2 py-2.5 border-b border-border/40">
            <span className="text-xs font-medium text-muted-foreground">Cód. pedido</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold font-mono text-foreground">{ticket.orderCode}</span>
              <CopyButton text={ticket.orderCode} />
            </div>
          </div>
        )}

        {/* Ticket URL */}
        {ticket.ticketUrl && (
          <div className="py-2.5">
            <a
              href={ticket.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary active:opacity-70"
            >
              <ExternalLink className="h-4 w-4" />
              Ver ingresso
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function TicketEmptyState({ eventId }: { eventId: string }) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <TicketForm
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
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
        <Plus className="h-5 w-5 text-purple-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Adicionar dados do ingresso</p>
        <p className="text-xs text-muted-foreground">Setor, valor, fornecedor e mais</p>
      </div>
    </button>
  );
}

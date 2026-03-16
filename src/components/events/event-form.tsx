'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  CalendarDays,
  Ticket,
  Car,
  Hotel,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { eventFormSchema, type EventFormSchema } from '@/schemas';
import { useEventsStore } from '@/stores/events-store';
import { generateDefaultChecklist } from '@/lib/domain/checklist';
import { parseTicketUrlImport } from '@/lib/domain/url-import';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  EVENT_TYPES,
  TRANSPORT_TYPES,
  PURCHASE_TYPES,
  TICKET_PROVIDERS,
  BRAZILIAN_STATES,
  EXPENSE_CATEGORIES,
} from '@/lib/constants';
import type { EventWithRelations } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: EventWithRelations;
}

// ─── Section tab ids ──────────────────────────────────────────────────────────

type SectionId = 'evento' | 'ingresso' | 'viagem' | 'hospedagem' | 'observacoes';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  emoji: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'evento',      label: 'Evento',      icon: CalendarDays, emoji: '🎤' },
  { id: 'ingresso',    label: 'Ingresso',    icon: Ticket,       emoji: '🎟️' },
  { id: 'viagem',      label: 'Viagem',      icon: Car,          emoji: '🚗' },
  { id: 'hospedagem',  label: 'Hospedagem',  icon: Hotel,        emoji: '🏨' },
  { id: 'observacoes', label: 'Observações', icon: FileText,     emoji: '📝' },
];

// ─── Default form values ──────────────────────────────────────────────────────

function buildDefaults(initial?: EventWithRelations): EventFormSchema {
  const e = initial?.event;
  const t = initial?.ticket;
  const tr = initial?.travel;
  const l = initial?.lodging;

  return {
    title:      e?.title      ?? '',
    artist:     e?.artist     ?? '',
    type:       e?.type       ?? 'show',
    status:     e?.status     ?? 'ativo',
    date:       e?.date       ?? '',
    endDate:    e?.endDate    ?? '',
    time:       e?.time       ?? '',
    city:       e?.city       ?? '',
    state:      e?.state      ?? '',
    venue:      e?.venue      ?? '',
    budgetTotal: e?.budgetTotal ?? undefined,
    budgetByCategory: {
      ingresso: e?.budgetByCategory?.ingresso ?? undefined,
      transporte: e?.budgetByCategory?.transporte ?? undefined,
      hospedagem: e?.budgetByCategory?.hospedagem ?? undefined,
      alimentacao: e?.budgetByCategory?.alimentacao ?? undefined,
      merch: e?.budgetByCategory?.merch ?? undefined,
      extras: e?.budgetByCategory?.extras ?? undefined,
      outro: e?.budgetByCategory?.outro ?? undefined,
    },
    notes:      e?.notes      ?? '',
    coverImage: e?.coverImage ?? '',

    ticket: {
      purchased:    t?.purchased    ?? false,
      sector:       t?.sector       ?? '',
      ticketType:   t?.ticketType   ?? '',
      purchaseType: t?.purchaseType ?? 'inteira',
      provider:     t?.provider     ?? '',
      price:        t?.price        ?? 0,
      fee:          t?.fee          ?? 0,
      orderCode:    t?.orderCode    ?? '',
      ticketUrl:    t?.ticketUrl    ?? '',
    },

    travel: {
      transportType:    tr?.transportType    ?? 'onibus',
      company:          tr?.company          ?? '',
      booked:           tr?.booked           ?? false,
      departureLocation: tr?.departureLocation ?? '',
      arrivalLocation:  tr?.arrivalLocation  ?? '',
      outboundDateTime: tr?.outboundDateTime ?? '',
      returnDateTime:   tr?.returnDateTime   ?? '',
      locatorCode:      tr?.locatorCode      ?? '',
      bookingUrl:       tr?.bookingUrl       ?? '',
    },

    lodging: {
      required:   l?.required   ?? false,
      name:       l?.name       ?? '',
      address:    l?.address    ?? '',
      checkIn:    l?.checkIn    ?? '',
      checkOut:   l?.checkOut   ?? '',
      price:      l?.price      ?? undefined,
      confirmed:  l?.confirmed  ?? false,
      bookingUrl: l?.bookingUrl ?? '',
    },
  };
}

function normalizeBudgetByCategory(
  values: EventFormSchema['budgetByCategory'],
): EventFormSchema['budgetByCategory'] | undefined {
  const normalized = Object.fromEntries(
    Object.entries(values ?? {}).filter(([, value]) => typeof value === 'number' && value >= 0),
  ) as EventFormSchema['budgetByCategory']

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when a section has meaningful data filled in. */
function sectionHasData(id: SectionId, values: EventFormSchema): boolean {
  switch (id) {
    case 'evento':
      return !!(values.title || values.artist || values.date || values.city || values.budgetTotal);
    case 'ingresso':
      return !!(
        values.ticket?.purchased ||
        values.ticket?.sector ||
        values.ticket?.price ||
        values.ticket?.provider
      );
    case 'viagem':
      return !!(
        values.travel?.booked ||
        values.travel?.company ||
        values.travel?.departureLocation
      );
    case 'hospedagem':
      return !!(
        values.lodging?.required ||
        values.lodging?.name ||
        values.lodging?.confirmed
      );
    case 'observacoes':
      return !!(values.notes);
    default:
      return false;
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }

  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Falha ao processar imagem selecionada.'));
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo da imagem.'));
    reader.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventForm({ mode, initialData }: EventFormProps) {
  const router = useRouter();
  const addEvent       = useEventsStore((s) => s.addEvent);
  const updateEvent    = useEventsStore((s) => s.updateEvent);
  const upsertTicket   = useEventsStore((s) => s.upsertTicket);
  const upsertTravel   = useEventsStore((s) => s.upsertTravel);
  const upsertLodging  = useEventsStore((s) => s.upsertLodging);
  const addChecklistItem = useEventsStore((s) => s.addChecklistItem);

  const [activeSection, setActiveSection] = useState<SectionId>('evento');
  const [saving, setSaving] = useState(false);
  const [ticketImportUrl, setTicketImportUrl] = useState('');
  const [importingTicketUrl, setImportingTicketUrl] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormSchema>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: buildDefaults(initialData),
  });

  const watchedValues = watch();
  const coverImage = watch('coverImage');
  const ticketPurchased = watch('ticket.purchased');
  const lodgingRequired = watch('lodging.required');
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const removeCoverImage = () => {
    setValue('coverImage', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
  };

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione um arquivo de imagem (JPG, PNG, WebP, etc).',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: 'Imagem muito grande',
        description: 'A imagem de capa deve ter no máximo 5 MB.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setValue('coverImage', dataUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      toast({
        title: 'Imagem selecionada',
        description: 'A nova capa será salva junto com o evento.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao carregar imagem',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleImportTicketUrl = () => {
    setImportingTicketUrl(true);
    try {
      const imported = parseTicketUrlImport(ticketImportUrl);
      const appliedFields: string[] = [];
      const importSetValueConfig = { shouldDirty: true, shouldTouch: true };

      setValue('ticket.purchased', true, importSetValueConfig);
      setValue('ticket.provider', imported.provider, importSetValueConfig);
      setValue('ticket.ticketUrl', imported.normalizedUrl, importSetValueConfig);
      appliedFields.push('plataforma do ingresso', 'link do ingresso');

      if (!watchedValues.title.trim() && imported.hints.title) {
        setValue('title', imported.hints.title, importSetValueConfig);
        appliedFields.push('nome do evento');
      }

      if (!watchedValues.date.trim() && imported.hints.date) {
        setValue('date', imported.hints.date, importSetValueConfig);
        appliedFields.push('data do evento');
      }

      if (!watchedValues.city.trim() && imported.hints.city) {
        setValue('city', imported.hints.city, importSetValueConfig);
        appliedFields.push('cidade');
      }

      toast({
        title: 'Importação concluída',
        description: `Campos preenchidos: ${appliedFields.join(', ')}.`,
      });
    } catch (err) {
      toast({
        title: 'Não foi possível importar a URL',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setImportingTicketUrl(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const onSubmit = async (data: EventFormSchema) => {
    setSaving(true);
    try {
      let eventId: string;
      const normalizedBudgetByCategory = normalizeBudgetByCategory(data.budgetByCategory)

      if (mode === 'create') {
        const created = await addEvent({
          title:      data.title,
          artist:     data.artist,
          type:       data.type,
          status:     data.status ?? 'ativo',
          date:       data.date,
          endDate:    data.endDate || undefined,
          time:       data.time    || undefined,
          city:       data.city,
          state:      data.state,
          venue:      data.venue,
          budgetTotal: data.budgetTotal,
          budgetByCategory: normalizedBudgetByCategory,
          notes:      data.notes  || undefined,
          coverImage: data.coverImage || undefined,
        });
        eventId = created.id;

        // Generate default checklist
        const checklistItems = generateDefaultChecklist(eventId);
        for (const item of checklistItems) {
          await addChecklistItem(item);
        }
      } else {
        const id = initialData!.event.id;
        await updateEvent(id, {
          title:      data.title,
          artist:     data.artist,
          type:       data.type,
          status:     data.status ?? initialData!.event.status,
          date:       data.date,
          endDate:    data.endDate || undefined,
          time:       data.time    || undefined,
          city:       data.city,
          state:      data.state,
          venue:      data.venue,
          budgetTotal: data.budgetTotal,
          budgetByCategory: normalizedBudgetByCategory,
          notes:      data.notes  || undefined,
          coverImage: data.coverImage || undefined,
        });
        eventId = id;
      }

      // ── Ticket ────────────────────────────────────────────────────────
      if (data.ticket) {
        await upsertTicket({
          id:           initialData?.ticket?.id,
          eventId,
          sector:       data.ticket.sector       || '',
          ticketType:   data.ticket.ticketType   || '',
          purchaseType: data.ticket.purchaseType ?? 'inteira',
          provider:     data.ticket.provider     || '',
          price:        data.ticket.price        ?? 0,
          fee:          data.ticket.fee          ?? 0,
          purchased:    data.ticket.purchased    ?? false,
          orderCode:    data.ticket.orderCode    || undefined,
          ticketUrl:    data.ticket.ticketUrl    || undefined,
        });
      }

      // ── Travel ────────────────────────────────────────────────────────
      if (data.travel) {
        await upsertTravel({
          id:                initialData?.travel?.id,
          eventId,
          transportType:     data.travel.transportType     ?? 'onibus',
          company:           data.travel.company           || undefined,
          booked:            data.travel.booked            ?? false,
          departureLocation: data.travel.departureLocation || '',
          arrivalLocation:   data.travel.arrivalLocation   || '',
          outboundDateTime:  data.travel.outboundDateTime  || undefined,
          returnDateTime:    data.travel.returnDateTime    || undefined,
          locatorCode:       data.travel.locatorCode       || undefined,
          bookingUrl:        data.travel.bookingUrl        || undefined,
        });
      }

      // ── Lodging ───────────────────────────────────────────────────────
      if (data.lodging) {
        await upsertLodging({
          id:         initialData?.lodging?.id,
          eventId,
          required:   data.lodging.required   ?? false,
          name:       data.lodging.name       || undefined,
          address:    data.lodging.address    || undefined,
          checkIn:    data.lodging.checkIn    || undefined,
          checkOut:   data.lodging.checkOut   || undefined,
          price:      data.lodging.price      ?? undefined,
          confirmed:  data.lodging.confirmed  ?? false,
          bookingUrl: data.lodging.bookingUrl || undefined,
        });
      }

      toast({
        title: mode === 'create' ? 'Evento criado!' : 'Evento atualizado!',
        description:
          mode === 'create'
            ? 'Seu evento foi salvo. A checklist padrão foi gerada.'
            : 'As informações foram atualizadas com sucesso.',
      });

      router.push(`/events/${eventId}`);
    } catch (err) {
      const description = getErrorMessage(err);
      console.error('Erro ao salvar evento:', err);
      toast({
        title: mode === 'create' ? 'Erro ao criar evento' : 'Erro ao atualizar evento',
        description,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <Link
          href={mode === 'edit' ? `/events/${initialData?.event.id}` : '/events'}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === 'create' ? 'Eventos' : 'Voltar'}
        </Link>

        <h1 className="text-base font-semibold text-foreground truncate">
          {mode === 'create' ? 'Novo Evento' : 'Editar Evento'}
        </h1>

        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 px-4 py-2 text-xs font-semibold text-white shadow active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Salvar
        </button>
      </header>

      {/* ── Section tab bar ────────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-20 border-b border-border/40 bg-background/90 backdrop-blur overflow-x-auto scrollbar-hide">
        <div className="flex w-max px-2">
          {SECTIONS.map((section) => {
            const hasData = sectionHasData(section.id, watchedValues);
            const isActive = activeSection === section.id;
            const hasError =
              section.id === 'evento' &&
              !!(errors.title || errors.artist || errors.date || errors.city || errors.state || errors.venue);

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{section.emoji}</span>
                <span>{section.label}</span>

                {/* Completion dot */}
                {hasData && !hasError && (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                  </span>
                )}
                {hasError && (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                    !
                  </span>
                )}

                {/* Active underline */}
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form body ──────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto"
        noValidate
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="px-4 pt-5 pb-32 space-y-5"
          >
            {/* ════════════════════════════════════════════════════════════
                SECTION 1 — EVENTO
            ════════════════════════════════════════════════════════════ */}
            {activeSection === 'evento' && (
              <>
                <FormField
                  label="Nome do Evento"
                  required
                  error={errors.title?.message}
                >
                  <Input
                    {...register('title')}
                    placeholder="Ex: Rock in Rio 2026"
                    autoFocus
                  />
                </FormField>

                <FormField
                  label="Artista / Headliner"
                  error={errors.artist?.message}
                >
                  <Input
                    {...register('artist')}
                    placeholder="Ex: Iron Maiden"
                  />
                </FormField>

                <FormRow>
                  <FormField label="Tipo" error={errors.type?.message}>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo do evento" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(EVENT_TYPES).map(([value, meta]) => (
                              <SelectItem key={value} value={value}>
                                {meta.icon} {meta.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField label="Data" required error={errors.date?.message}>
                    <Input
                      {...register('date')}
                      type="date"
                    />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField label="Data Final (opcional)" error={errors.endDate?.message}>
                    <Input
                      {...register('endDate')}
                      type="date"
                    />
                  </FormField>

                  <FormField label="Horário" error={errors.time?.message}>
                    <Input
                      {...register('time')}
                      type="time"
                      placeholder="21:00"
                    />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField label="Cidade" required error={errors.city?.message} className="flex-[2]">
                    <Input
                      {...register('city')}
                      placeholder="São Paulo"
                    />
                  </FormField>

                  <FormField label="Estado" required error={errors.state?.message}>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_STATES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.value} — {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                </FormRow>

                <FormField label="Local / Venue" required error={errors.venue?.message}>
                  <Input
                    {...register('venue')}
                    placeholder="Ex: Parque Olímpico"
                  />
                </FormField>

                <FormField
                  label="Orçamento total (R$)"
                  description="Defina um limite de gasto para receber alertas preditivos no evento."
                  error={errors.budgetTotal?.message}
                >
                  <Input
                    {...register('budgetTotal', { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0,00"
                  />
                </FormField>

                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground">Orçamento por categoria (opcional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(EXPENSE_CATEGORIES) as Array<keyof NonNullable<EventFormSchema['budgetByCategory']>>).map((category) => (
                      <FormField
                        key={category}
                        label={`${EXPENSE_CATEGORIES[category].icon} ${EXPENSE_CATEGORIES[category].label}`}
                        error={errors.budgetByCategory?.[category]?.message}
                      >
                        <Input
                          {...register(`budgetByCategory.${category}` as const, { valueAsNumber: true })}
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0,00"
                        />
                      </FormField>
                    ))}
                  </div>
                </div>

                <FormField
                  label="Imagem de capa (opcional)"
                  description="Faça upload de uma imagem para personalizar o evento. Máximo: 5 MB."
                  error={errors.coverImage?.message}
                >
                  <div className="space-y-3">
                    {coverImage ? (
                      <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                        <img
                          src={coverImage}
                          alt={`Capa do evento ${watch('title') || 'sem título'}`}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-xs text-muted-foreground">
                        Nenhuma imagem selecionada
                      </div>
                    )}

                    <Input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                    />

                    {coverImage && (
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Remover capa
                      </button>
                    )}
                  </div>
                </FormField>

                <SectionNav
                  onNext={() => setActiveSection('ingresso')}
                  nextLabel="Ingresso"
                />
              </>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 2 — INGRESSO
            ════════════════════════════════════════════════════════════ */}
            {activeSection === 'ingresso' && (
              <>
                <SwitchField
                  control={control}
                  name="ticket.purchased"
                  label="Ingresso comprado"
                  description="Marque quando o ingresso já estiver em mãos."
                />

                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <Label className="text-xs font-semibold">Importar por URL (Sympla/Eventim)</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={ticketImportUrl}
                      onChange={(event) => setTicketImportUrl(event.target.value)}
                      type="url"
                      placeholder="Cole o link do Sympla ou Eventim"
                    />
                    <button
                      type="button"
                      onClick={handleImportTicketUrl}
                      disabled={!ticketImportUrl.trim() || importingTicketUrl}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {importingTicketUrl ? 'Importando...' : 'Importar URL'}
                    </button>
                  </div>
                </div>

                <FormRow>
                  <FormField label="Setor / Lote">
                    <Input
                      {...register('ticket.sector')}
                      placeholder="Pista Premium"
                    />
                  </FormField>

                  <FormField label="Tipo de Ingresso">
                    <Input
                      {...register('ticket.ticketType')}
                      placeholder="VIP, Meia, etc."
                    />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField label="Modalidade de Compra">
                    <Controller
                      control={control}
                      name="ticket.purchaseType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PURCHASE_TYPES).map(([v, meta]) => (
                              <SelectItem key={v} value={v}>
                                {meta.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField label="Plataforma">
                    <Controller
                      control={control}
                      name="ticket.provider"
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Onde comprou?" />
                          </SelectTrigger>
                          <SelectContent>
                            {TICKET_PROVIDERS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField
                    label="Valor do Ingresso (R$)"
                    error={errors.ticket?.price?.message}
                  >
                    <Input
                      {...register('ticket.price', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0,00"
                    />
                  </FormField>

                  <FormField
                    label="Taxa de Serviço (R$)"
                    error={errors.ticket?.fee?.message}
                  >
                    <Input
                      {...register('ticket.fee', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0,00"
                    />
                  </FormField>
                </FormRow>

                <AnimatePresence>
                  {ticketPurchased && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      <FormField label="Código do Pedido">
                        <Input
                          {...register('ticket.orderCode')}
                          placeholder="Ex: 123456789"
                        />
                      </FormField>

                      <FormField label="Link do Ingresso">
                        <Input
                          {...register('ticket.ticketUrl')}
                          type="url"
                          placeholder="https://..."
                        />
                      </FormField>
                    </motion.div>
                  )}
                </AnimatePresence>

                <SectionNav
                  onPrev={() => setActiveSection('evento')}
                  onNext={() => setActiveSection('viagem')}
                  prevLabel="Evento"
                  nextLabel="Viagem"
                />
              </>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 3 — VIAGEM
            ════════════════════════════════════════════════════════════ */}
            {activeSection === 'viagem' && (
              <>
                <FormRow>
                  <FormField label="Meio de Transporte" className="flex-[2]">
                    <Controller
                      control={control}
                      name="travel.transportType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TRANSPORT_TYPES).map(([v, meta]) => (
                              <SelectItem key={v} value={v}>
                                {meta.icon} {meta.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField label="Empresa / Companhia">
                    <Input
                      {...register('travel.company')}
                      placeholder="LATAM, Cometa…"
                    />
                  </FormField>
                </FormRow>

                <SwitchField
                  control={control}
                  name="travel.booked"
                  label="Transporte reservado"
                  description="Marque quando passagem ou reserva estiver confirmada."
                />

                <FormRow>
                  <FormField label="Saída de">
                    <Input
                      {...register('travel.departureLocation')}
                      placeholder="São Paulo, SP"
                    />
                  </FormField>

                  <FormField label="Chegando em">
                    <Input
                      {...register('travel.arrivalLocation')}
                      placeholder="Rio de Janeiro, RJ"
                    />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField label="Data/hora de ida">
                    <Input
                      {...register('travel.outboundDateTime')}
                      type="datetime-local"
                    />
                  </FormField>

                  <FormField label="Data/hora de volta">
                    <Input
                      {...register('travel.returnDateTime')}
                      type="datetime-local"
                    />
                  </FormField>
                </FormRow>

                <FormField label="Localizador / Código de reserva">
                  <Input
                    {...register('travel.locatorCode')}
                    placeholder="ABC123"
                  />
                </FormField>

                <FormField label="Link de reserva">
                  <Input
                    {...register('travel.bookingUrl')}
                    type="url"
                    placeholder="https://..."
                  />
                </FormField>

                <SectionNav
                  onPrev={() => setActiveSection('ingresso')}
                  onNext={() => setActiveSection('hospedagem')}
                  prevLabel="Ingresso"
                  nextLabel="Hospedagem"
                />
              </>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 4 — HOSPEDAGEM
            ════════════════════════════════════════════════════════════ */}
            {activeSection === 'hospedagem' && (
              <>
                <SwitchField
                  control={control}
                  name="lodging.required"
                  label="Precisa de hospedagem"
                  description="Ative se vai se hospedar fora de casa para o evento."
                />

                <AnimatePresence>
                  {lodgingRequired && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      <FormField label="Nome do hotel / Airbnb">
                        <Input
                          {...register('lodging.name')}
                          placeholder="Hotel Ibis Centro"
                        />
                      </FormField>

                      <FormField label="Endereço">
                        <Input
                          {...register('lodging.address')}
                          placeholder="Rua Exemplo, 123 — Rio de Janeiro"
                        />
                      </FormField>

                      <FormRow>
                        <FormField label="Check-in">
                          <Input
                            {...register('lodging.checkIn')}
                            type="date"
                          />
                        </FormField>

                        <FormField label="Check-out">
                          <Input
                            {...register('lodging.checkOut')}
                            type="date"
                          />
                        </FormField>
                      </FormRow>

                      <FormField label="Valor da diária (R$)">
                        <Input
                          {...register('lodging.price', { valueAsNumber: true })}
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0,00"
                        />
                      </FormField>

                      <SwitchField
                        control={control}
                        name="lodging.confirmed"
                        label="Hospedagem confirmada"
                        description="Marque quando a reserva estiver garantida."
                      />

                      <FormField label="Link de reserva">
                        <Input
                          {...register('lodging.bookingUrl')}
                          type="url"
                          placeholder="https://..."
                        />
                      </FormField>
                    </motion.div>
                  )}
                </AnimatePresence>

                <SectionNav
                  onPrev={() => setActiveSection('viagem')}
                  onNext={() => setActiveSection('observacoes')}
                  prevLabel="Viagem"
                  nextLabel="Observações"
                />
              </>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 5 — OBSERVAÇÕES
            ════════════════════════════════════════════════════════════ */}
            {activeSection === 'observacoes' && (
              <>
                <FormField
                  label="Notas sobre o evento"
                  description="Qualquer detalhe extra: setlist esperado, combinados com amigos, etc."
                  error={errors.notes?.message}
                >
                  <Textarea
                    {...register('notes')}
                    placeholder="Anotações livres sobre o evento…"
                    rows={6}
                    className="resize-none"
                  />
                </FormField>

                <SectionNav
                  onPrev={() => setActiveSection('hospedagem')}
                  prevLabel="Hospedagem"
                />

                {/* Big save button at the end */}
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'mt-4 w-full flex items-center justify-center gap-2 rounded-2xl py-4',
                    'bg-gradient-to-br from-violet-500 to-purple-700',
                    'text-white font-semibold text-base shadow-lg shadow-primary/30',
                    'active:scale-[0.98] transition-transform',
                    'disabled:opacity-60',
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {saving
                    ? 'Salvando…'
                    : mode === 'create'
                      ? 'Criar Evento'
                      : 'Salvar Alterações'}
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({ label, required, description, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="flex items-center gap-1 text-sm font-medium">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground leading-snug -mt-0.5">{description}</p>
      )}
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── FormRow ──────────────────────────────────────────────────────────────────

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3">{children}</div>;
}

// ─── SwitchField ──────────────────────────────────────────────────────────────

interface SwitchFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label: string;
  description?: string;
}

function SwitchField({ control, name, label, description }: SwitchFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {description && (
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
            )}
          </div>
          <Switch
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
        </div>
      )}
    />
  );
}

// ─── SectionNav ───────────────────────────────────────────────────────────────

interface SectionNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
}

function SectionNav({ onPrev, onNext, prevLabel, nextLabel }: SectionNavProps) {
  return (
    <div className="flex justify-between pt-2">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="h-4 w-4 -rotate-90" />
          {prevLabel}
        </button>
      ) : (
        <div />
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          {nextLabel}
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      )}
    </div>
  );
}

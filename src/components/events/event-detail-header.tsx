'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Clock,
  Calendar,
  Ticket,
  Car,
  Hotel,
  CheckCircle2,
  Circle,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event, Ticket as TicketType, Travel, Lodging, ChecklistItem } from '@/types';
import { EVENT_TYPES } from '@/lib/constants';
import { formatDateLong, formatDate } from '@/lib/formatters';
import { getCountdown } from '@/lib/domain/countdown';
import { calculateReadiness } from '@/lib/domain/readiness';
import { ReadinessBar } from './readiness-bar';
import { EventTypeBadge, EventStatusBadge } from './event-status-badge';
import { CountdownBadge } from './countdown-badge';

// ─── Gradient map per event type ──────────────────────────────────────────────

const typeGradient: Record<Event['type'], string> = {
  show:      'from-violet-600 via-purple-700 to-indigo-800',
  festival:  'from-amber-500 via-orange-600 to-red-600',
  convencao: 'from-blue-500 via-sky-600 to-cyan-700',
  outro:     'from-slate-500 via-slate-600 to-slate-800',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventDetailHeaderProps {
  event: Event;
  ticket?: TicketType;
  travel?: Travel;
  lodging?: Lodging;
  checklist: ChecklistItem[];
  onEdit: () => void;
}

// ─── Quick Status Item ────────────────────────────────────────────────────────

interface QuickStatusItemProps {
  icon: React.ElementType;
  label: string;
  done: boolean;
  pending?: boolean | null;
  notRequired?: boolean;
}

function QuickStatusItem({ icon: Icon, label, done, pending, notRequired }: QuickStatusItemProps) {
  const statusColor = done
    ? 'text-emerald-400'
    : pending
      ? 'text-amber-400'
      : notRequired
        ? 'text-white/40'
        : 'text-white/30';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
          done
            ? 'bg-emerald-500/20 ring-1 ring-emerald-400/30'
            : pending
              ? 'bg-amber-500/20 ring-1 ring-amber-400/30'
              : 'bg-white/10',
        )}
      >
        <Icon className={cn('h-5 w-5', statusColor)} />
      </div>
      <span className="text-[10px] font-medium text-white/70 leading-none">{label}</span>
      <div className={cn('h-1 w-1 rounded-full', done ? 'bg-emerald-400' : pending ? 'bg-amber-400' : 'bg-white/20')} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventDetailHeader({
  event,
  ticket,
  travel,
  lodging,
  checklist,
  onEdit,
}: EventDetailHeaderProps) {
  const router = useRouter();
  const countdown = getCountdown(event.date, event.time);
  const gradient = typeGradient[event.type];
  const typeMeta = EVENT_TYPES[event.type];
  const hasCoverImage = !!event.coverImage;

  const readiness = calculateReadiness({
    event,
    ticket,
    travel,
    lodging,
    expenses: [],
    itinerary: [],
    checklist,
  });

  const isPast = countdown.isPast || event.status === 'concluido' || event.status === 'cancelado';

  const hasTicket = ticket?.purchased ?? false;
  const hasTravel = travel?.booked ?? false;
  const lodgingRequired = lodging?.required ?? false;
  const hasLodging = !lodgingRequired || (lodging?.confirmed ?? false);
  const lodgingNotRequired = !lodgingRequired;

  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistTotal = checklist.length;

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', gradient)}>
      {hasCoverImage && (
        <>
          <img
            src={event.coverImage}
            alt={`Capa do evento ${event.title || event.artist}`}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/35" />
        </>
      )}

      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/10 blur-xl" />

      {/* Top bar: back + edit */}
      <div className="relative flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-white backdrop-blur-sm transition-all active:scale-90"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <button
          onClick={onEdit}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-black/20 px-3 text-sm font-semibold text-white backdrop-blur-sm transition-all active:scale-95"
          aria-label="Editar evento"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
      </div>

      {/* Hero content */}
      <div className="relative px-5 pb-5 pt-2">
        {/* Type + status badges */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm ring-1 ring-white/20">
            <span>{typeMeta.icon}</span>
            <span>{typeMeta.label}</span>
          </span>
          {event.status === 'concluido' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-200 ring-1 ring-blue-400/30">
              <CheckCheck className="h-3 w-3" />
              Concluído
            </span>
          )}
          {event.status === 'cancelado' && (
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-200 ring-1 ring-red-400/30">
              Cancelado
            </span>
          )}
          {event.status === 'wishlist' && (
            <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-200 ring-1 ring-yellow-400/30">
              ⭐ Wishlist
            </span>
          )}
        </div>

        {/* Title + Artist */}
        <h1 className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
          {event.title || event.artist}
        </h1>
        {event.title && event.title !== event.artist && (
          <p className="mt-1 text-base font-semibold text-white/80">
            {event.artist}
          </p>
        )}

        {/* Date + time */}
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-white/80">
          <Calendar className="h-4 w-4 flex-shrink-0 text-white/60" />
          <span className="capitalize">{formatDateLong(event.date)}</span>
          {event.time && (
            <>
              <span className="text-white/40">·</span>
              <Clock className="h-4 w-4 flex-shrink-0 text-white/60" />
              <span>{event.time}</span>
            </>
          )}
        </div>

        {/* Venue + city */}
        <div className="mt-1.5 flex items-start gap-2 text-sm text-white/70">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/50" />
          <span className="leading-snug">
            {event.venue && <span className="font-medium text-white/90">{event.venue}</span>}
            {event.venue && ' · '}
            {event.city}, {event.state}
          </span>
        </div>

        {/* Countdown */}
        {!isPast && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex flex-col items-center rounded-2xl bg-black/20 px-8 py-4 backdrop-blur-sm ring-1 ring-white/15">
              {countdown.isToday ? (
                <span className="animate-pulse text-3xl font-black text-emerald-300">
                  Hoje! 🎉
                </span>
              ) : countdown.isTomorrow ? (
                <>
                  <span className="text-3xl font-black text-white">Amanhã!</span>
                  <span className="mt-0.5 text-xs font-medium text-white/60">o grande dia</span>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-black leading-none text-white tabular-nums">
                      {countdown.days}
                    </span>
                    <span className="mb-1 text-lg font-semibold text-white/70">
                      {countdown.days === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                  <span className="mt-0.5 text-xs font-medium text-white/60">até o evento</span>
                </>
              )}
            </div>
          </div>
        )}

        {isPast && event.status !== 'cancelado' && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex flex-col items-center rounded-2xl bg-black/20 px-6 py-3 backdrop-blur-sm ring-1 ring-white/15">
              <span className="text-sm font-semibold text-white/70">{countdown.label}</span>
            </div>
          </div>
        )}

        {/* Quick status row */}
        {event.status === 'ativo' && (
          <div className="mt-5 flex items-start justify-around">
            <QuickStatusItem
              icon={Ticket}
              label="Ingresso"
              done={hasTicket}
              pending={!!ticket && !ticket.purchased}
            />
            <QuickStatusItem
              icon={Car}
              label="Transporte"
              done={hasTravel}
              pending={!!travel && !travel.booked}
            />
            <QuickStatusItem
              icon={Hotel}
              label="Hospedagem"
              done={hasLodging}
              pending={lodgingRequired && !lodging?.confirmed}
              notRequired={lodgingNotRequired && !lodging}
            />
            {/* Checklist mini progress */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  checklistTotal > 0 && checklistDone === checklistTotal
                    ? 'bg-emerald-500/20 ring-1 ring-emerald-400/30'
                    : checklistTotal > 0
                      ? 'bg-white/10 ring-1 ring-white/20'
                      : 'bg-white/10',
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-5 w-5',
                    checklistTotal > 0 && checklistDone === checklistTotal
                      ? 'text-emerald-400'
                      : 'text-white/50',
                  )}
                />
              </div>
              <span className="text-[10px] font-medium text-white/70 leading-none">Checklist</span>
              <span className="text-[10px] font-bold text-white/80 tabular-nums">
                {checklistDone}/{checklistTotal}
              </span>
            </div>
          </div>
        )}

        {/* Readiness bar */}
        {event.status === 'ativo' && (
          <div className="mt-5 rounded-xl bg-black/20 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/80">Prontidão</span>
              <span className="text-xs font-bold text-white tabular-nums">{readiness.score}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  readiness.level === 'pronto'
                    ? 'bg-emerald-400'
                    : readiness.level === 'quase_pronto'
                      ? 'bg-blue-400'
                      : readiness.level === 'organizando'
                        ? 'bg-amber-400'
                        : 'bg-white/40',
                )}
                style={{ width: `${readiness.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-white/60">{readiness.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

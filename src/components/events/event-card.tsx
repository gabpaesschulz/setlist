'use client';

import Link from 'next/link';
import { MapPin, Ticket, Car, Hotel, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event, Ticket as TicketType, Travel, Lodging, Expense, ChecklistItem } from '@/types';
import { EVENT_TYPES } from '@/lib/constants';
import { getCountdown } from '@/lib/domain/countdown';
import { calculateReadiness } from '@/lib/domain/readiness';
import { formatDate } from '@/lib/formatters';
import { CountdownBadge } from './countdown-badge';
import { ReadinessBar } from './readiness-bar';
import { EventTypeBadge } from './event-status-badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event;
  ticket?: TicketType;
  travel?: Travel;
  lodging?: Lodging;
  expenses: Expense[];
  checklist: ChecklistItem[];
  compact?: boolean;
}

// ─── Gradient map per event type ──────────────────────────────────────────────

const typeGradient: Record<Event['type'], string> = {
  show:      'from-violet-600 via-purple-600 to-indigo-700',
  festival:  'from-amber-500 via-orange-500 to-red-500',
  convencao: 'from-blue-500 via-sky-500 to-cyan-600',
  outro:     'from-slate-500 via-slate-600 to-slate-700',
};

const typeAccentBg: Record<Event['type'], string> = {
  show:      'bg-violet-500/10',
  festival:  'bg-amber-500/10',
  convencao: 'bg-blue-500/10',
  outro:     'bg-slate-500/10',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EventCard({
  event,
  ticket,
  travel,
  lodging,
  expenses,
  checklist,
  compact = false,
}: EventCardProps) {
  const countdown = getCountdown(event.date, event.time);
  const isPast = countdown.isPast || event.status === 'concluido' || event.status === 'cancelado';

  const readiness = calculateReadiness({
    event,
    ticket,
    travel,
    lodging,
    expenses,
    itinerary: [],
    checklist,
  });

  const gradient = typeGradient[event.type];
  const accentBg = typeAccentBg[event.type];
  const typeMeta = EVENT_TYPES[event.type];

  // Quick status icons
  const hasTicket = ticket?.purchased;
  const hasTravel = travel?.booked;
  const hasLodging = !lodging?.required || lodging?.confirmed;

  if (compact) {
    return (
      <Link href={`/events/${event.id}`} className="block">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-3 py-3',
            'active:scale-[0.98] transition-transform duration-150 shadow-sm',
            isPast && 'opacity-60',
          )}
        >
          {/* Type dot / emoji */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg',
              accentBg,
            )}
          >
            {typeMeta.icon}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {event.title || event.artist}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {formatDate(event.date)} · {event.city}
            </p>
          </div>

          {/* Countdown chip */}
          <CountdownBadge date={event.date} time={event.time} variant="card" />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`} className="block">
      <article
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm',
          'active:scale-[0.985] transition-all duration-150',
          isPast && 'opacity-65',
        )}
      >
        {/* ── Gradient accent strip ── */}
        <div className={cn('h-1.5 w-full bg-gradient-to-r', gradient)} />

        {/* ── Card body ── */}
        <div className="p-4">
          {/* Top row: badges + countdown */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <EventTypeBadge type={event.type} />
              {event.status === 'cancelado' && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500 ring-1 ring-red-500/20">
                  Cancelado
                </span>
              )}
              {event.status === 'wishlist' && (
                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-600 ring-1 ring-yellow-500/20">
                  ⭐ Wishlist
                </span>
              )}
            </div>

            <CountdownBadge date={event.date} time={event.time} variant="card" />
          </div>

          {/* Artist / Title */}
          <div className="mb-2">
            <h3 className="text-base font-bold text-foreground leading-tight line-clamp-1">
              {event.artist}
            </h3>
            {event.title && event.title !== event.artist && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {event.title}
              </p>
            )}
          </div>

          {/* Date + Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <span className="font-medium tabular-nums">
              {formatDate(event.date)}
              {event.time && ` · ${event.time}`}
            </span>
            <span className="text-border">·</span>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {event.venue ? `${event.venue}, ` : ''}{event.city}
            </span>
          </div>

          {/* Readiness bar */}
          {event.status !== 'cancelado' && !isPast && (
            <div className="mb-3">
              <ReadinessBar
                score={readiness.score}
                level={readiness.level}
                compact
                showLabel
              />
            </div>
          )}

          {/* Quick status icons */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
            <StatusIcon
              icon={Ticket}
              label="Ingresso"
              done={!!hasTicket}
              pending={!!ticket && !ticket.purchased}
            />
            <StatusIcon
              icon={Car}
              label="Transporte"
              done={!!hasTravel}
              pending={!!travel && !travel.booked}
            />
            <StatusIcon
              icon={Hotel}
              label="Hospedagem"
              done={hasLodging}
              pending={lodging?.required && !lodging.confirmed}
            />

            {/* Checklist progress */}
            {checklist.length > 0 && (
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">
                  {checklist.filter((c) => c.done).length}/{checklist.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── StatusIcon ───────────────────────────────────────────────────────────────

interface StatusIconProps {
  icon: React.ElementType;
  label: string;
  done: boolean;
  pending?: boolean;
}

function StatusIcon({ icon: Icon, label, done, pending }: StatusIconProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        done
          ? 'text-green-500'
          : pending
            ? 'text-yellow-500'
            : 'text-muted-foreground/50',
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={done ? 2.5 : 1.8} />
      {done ? (
        <CheckCircle2 className="h-2.5 w-2.5" />
      ) : (
        <Circle className="h-2.5 w-2.5 opacity-50" />
      )}
    </div>
  );
}

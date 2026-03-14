'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MapPin,
  Clock,
  TicketIcon,
  Car,
  Hotel,
  CheckSquare,
  ChevronRight,
  Music2,
} from 'lucide-react'
import type { Event, Ticket, Travel, Lodging, Expense, ChecklistItem } from '@/types'
import { getCountdown } from '@/lib/domain/countdown'
import { calculateReadiness } from '@/lib/domain/readiness'
import { formatDateLong } from '@/lib/formatters'
import { EVENT_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface NextEventHeroProps {
  event: Event
  ticket?: Ticket
  travel?: Travel
  lodging?: Lodging
  expenses: Expense[]
  checklist: ChecklistItem[]
}

// ─── Countdown Display ────────────────────────────────────────────────────────

function CountdownDisplay({ event }: { event: Event }) {
  const countdown = getCountdown(event.date, event.time)

  if (countdown.isToday) {
    return (
      <div className="text-center">
        <p className="text-5xl font-black tracking-tight text-white drop-shadow-lg">
          HOJE!
        </p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-white/70">
          É hoje que rola! 🎉
        </p>
      </div>
    )
  }

  if (countdown.isTomorrow) {
    return (
      <div className="text-center">
        <p className="text-5xl font-black tracking-tight text-white drop-shadow-lg">
          AMANHÃ!
        </p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-white/70">
          Falta só 1 dia! 🎶
        </p>
      </div>
    )
  }

  if (countdown.isPast) {
    return (
      <div className="text-center">
        <p className="text-4xl font-black tracking-tight text-white/60">
          Concluído
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex items-end justify-center gap-1">
        <span className="text-[3.5rem] font-black leading-none tracking-tight text-white drop-shadow-lg">
          {countdown.days}
        </span>
        <span className="mb-2 text-xl font-bold text-white/80">
          {countdown.days === 1 ? 'dia' : 'dias'}
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
        faltam para o show
      </p>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  icon: React.ReactNode
  label: string
  confirmed: boolean
  notApplicable?: boolean
}

function StatusBadge({ icon, label, confirmed, notApplicable }: StatusBadgeProps) {
  if (notApplicable) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm',
        confirmed
          ? 'bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-400/30'
          : 'bg-white/10 text-white/60 ring-1 ring-white/10',
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

// ─── Readiness Bar ────────────────────────────────────────────────────────────

function ReadinessBar({ score, label }: { score: number; label: string }) {
  const barColor =
    score >= 90
      ? 'bg-emerald-400'
      : score >= 60
        ? 'bg-sky-400'
        : score >= 25
          ? 'bg-amber-400'
          : 'bg-white/40'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
          Preparação
        </span>
        <span className="text-xs font-bold text-white/80">
          {label} · {score}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NextEventHero({
  event,
  ticket,
  travel,
  lodging,
  expenses,
  checklist,
}: NextEventHeroProps) {
  const readiness = calculateReadiness({
    event,
    ticket,
    travel,
    lodging,
    expenses,
    itinerary: [],
    checklist,
  })

  const checklistDone = checklist.filter((c) => c.done).length
  const checklistTotal = checklist.length
  const eventTypeInfo = EVENT_TYPES[event.type]

  // Lodging is only applicable if explicitly required
  const lodgingApplicable = lodging?.required === true

  return (
    <Link href={`/events/${event.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, #6d28d9 0%, #7c3aed 35%, #8b5cf6 65%, #a78bfa 100%)',
        }}
      >
        {/* Decorative background pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, white 0%, transparent 50%), radial-gradient(circle at 20% 80%, white 0%, transparent 40%)',
          }}
        />

        {/* Noise texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />

        <div className="relative px-5 pb-5 pt-4">
          {/* Header row: label + type badge */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
              Próximo Rolê
            </p>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/80 backdrop-blur-sm">
              {eventTypeInfo.icon} {eventTypeInfo.label}
            </span>
          </div>

          {/* Event title */}
          <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-white">
            {event.title}
          </h2>

          {/* Artist (when different from title) */}
          {event.artist && event.artist !== event.title && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white/70">
              <Music2 className="h-3.5 w-3.5 flex-shrink-0" />
              {event.artist}
            </p>
          )}

          {/* Countdown */}
          <div className="my-5">
            <CountdownDisplay event={event} />
          </div>

          {/* Date + Time */}
          <div className="flex items-center gap-2 text-sm font-medium text-white/75">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="capitalize">{formatDateLong(event.date)}</span>
            {event.time && (
              <span className="text-white/50">· {event.time}</span>
            )}
          </div>

          {/* Venue + City */}
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/75">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
              <MapPin className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="truncate">{event.venue}</span>
            <span className="text-white/50">·</span>
            <span className="flex-shrink-0 text-white/60">
              {event.city}, {event.state}
            </span>
          </div>

          {/* Status badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge
              icon={<TicketIcon className="h-3 w-3" />}
              label={ticket?.purchased ? 'Ingresso' : 'Sem ingresso'}
              confirmed={ticket?.purchased ?? false}
            />
            <StatusBadge
              icon={<Car className="h-3 w-3" />}
              label={travel?.booked ? 'Viagem' : 'Sem viagem'}
              confirmed={travel?.booked ?? false}
            />
            <StatusBadge
              icon={<Hotel className="h-3 w-3" />}
              label={lodging?.confirmed ? 'Hospedagem' : 'Sem hospedagem'}
              confirmed={lodging?.confirmed ?? false}
              notApplicable={!lodgingApplicable}
            />
            {checklistTotal > 0 && (
              <StatusBadge
                icon={<CheckSquare className="h-3 w-3" />}
                label={`Checklist ${checklistDone}/${checklistTotal}`}
                confirmed={checklistDone === checklistTotal}
              />
            )}
          </div>

          {/* Readiness bar */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <ReadinessBar score={readiness.score} label={readiness.label} />
          </div>

          {/* Tap affordance */}
          <div className="mt-3 flex items-center justify-end">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-white/40">
              Ver detalhes
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

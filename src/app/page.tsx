'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Plus,
  Music2,
  CalendarDays,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import { getNextEvent, getUpcomingEvents, sortEventsByDate } from '@/lib/domain/events'
import { getTotalExpensesForYear } from '@/lib/domain/expenses'
import { getCountdown } from '@/lib/domain/countdown'
import { formatDateLong } from '@/lib/formatters'
import { EVENT_TYPES } from '@/lib/constants'
import { NextEventHero } from '@/components/dashboard/next-event-hero'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { MonthStrip } from '@/components/dashboard/month-strip'
import { Skeleton } from '@/components/ui/skeleton'
import { useEventCoverImage } from '@/hooks/use-event-cover-image'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'

// ─── Section animation variants ───────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay },
  }),
}

// ─── Compact Event Card ────────────────────────────────────────────────────────

function CompactEventCard({ event, index }: { event: Event; index: number }) {
  const countdown = getCountdown(event.date, event.time)
  const typeInfo = EVENT_TYPES[event.type]
  const coverImage = useEventCoverImage(event)

  const countdownText = countdown.isToday
    ? 'Hoje!'
    : countdown.isTomorrow
      ? 'Amanhã!'
      : countdown.isPast
        ? 'Concluído'
        : `${countdown.days}d`

  const countdownColor = countdown.isToday
    ? 'text-emerald-600 bg-emerald-50'
    : countdown.isTomorrow
      ? 'text-amber-600 bg-amber-50'
      : countdown.isPast
        ? 'text-muted-foreground bg-muted'
        : 'text-primary bg-primary/8'

  return (
    <motion.div
      custom={index * 0.06}
      initial="hidden"
      animate="show"
      variants={fadeUp}
    >
      <Link
        href={`/events/${event.id}`}
        className="flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 shadow-sm ring-1 ring-border/60 transition-all duration-200 active:scale-[0.98] active:bg-muted/50"
      >
        {/* Type icon */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={`Capa do evento ${event.title || event.artist}`}
            className="h-10 w-10 flex-shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
            {typeInfo.icon}
          </div>
        )}

        {/* Event info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {event.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.city}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="capitalize truncate">{formatDateLong(event.date)}</span>
            </span>
          </div>
        </div>

        {/* Countdown badge */}
        <div className={cn('flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold', countdownColor)}>
          {countdownText}
        </div>

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
      </Link>
    </motion.div>
  )
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-primary/20 p-5 space-y-4">
      <Skeleton className="h-3 w-24 bg-white/20" />
      <Skeleton className="h-7 w-3/4 bg-white/20" />
      <Skeleton className="h-16 w-28 mx-auto bg-white/20" />
      <Skeleton className="h-4 w-2/3 bg-white/20" />
      <Skeleton className="h-4 w-1/2 bg-white/20" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-20 rounded-full bg-white/20" />
        <Skeleton className="h-7 w-20 rounded-full bg-white/20" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full bg-white/20" />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="flex gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-card p-3.5 ring-1 ring-border/60">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  )
}

function CardsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-border/60">
          <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-10 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onSeedDemo }: { onSeedDemo: () => Promise<void> }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center px-8 py-16 text-center"
    >
      {/* Icon cluster */}
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
          <Music2 className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
          <Sparkles className="h-4 w-4 text-amber-500" />
        </div>
        <div className="absolute -bottom-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
        </div>
      </div>

      <h2 className="text-xl font-black tracking-tight text-foreground">
        Nenhum show cadastrado
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Adicione seu primeiro evento e comece a organizar seu ano musical do jeito certo.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/events/new"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Adicionar Evento
        </Link>

        <button
          onClick={onSeedDemo}
          className="flex items-center justify-center gap-2 rounded-2xl bg-muted px-6 py-3.5 text-sm font-semibold text-muted-foreground transition-all duration-200 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          Carregar Dados Demo
        </button>
      </div>
    </motion.div>
  )
}

// ─── Current month label ──────────────────────────────────────────────────────

function getCurrentMonthLabel(): string {
  const now = new Date()
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return `${months[now.getMonth()]} de ${now.getFullYear()}`
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const {
    events,
    expenses,
    loading,
    loadAll,
    seedDemo,
    getTicketByEventId,
    getTravelByEventId,
    getLodgingByEventId,
    getExpensesByEventId,
    getChecklistByEventId,
  } = useEventsStore()

  const router = useRouter()
  const currentYear = new Date().getFullYear()

  // Load all data on mount
  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Derived data
  const nextEvent = getNextEvent(events)
  const upcoming = sortEventsByDate(getUpcomingEvents(events))
  // Events shown in "next events" list (after the hero, up to 4)
  const nextEventsList = nextEvent
    ? upcoming.filter((e) => e.id !== nextEvent.id).slice(0, 4)
    : upcoming.slice(0, 4)

  const totalSpent = getTotalExpensesForYear(expenses, currentYear)

  const uniqueCities = [
    ...new Set(
      events
        .filter((e) => e.status !== 'cancelado' && e.status !== 'wishlist')
        .map((e) => e.city)
        .filter(Boolean),
    ),
  ]

  const hasEvents = events.length > 0

  // ── Render: Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="safe-top" />
        <div className="px-4 pb-4 pt-5 space-y-4">
          {/* Header skeleton */}
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-2xl" />
          </div>
          <HeroSkeleton />
          <StatsSkeleton />
          <CardsSkeleton />
        </div>
      </div>
    )
  }

  // ── Render: Main ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Safe area top padding */}
      <div className="safe-top" />

      <div className="px-4 pb-6 pt-5">

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-5 flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Setlist
            </h1>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {hasEvents
                ? `Seu ano musical · ${getCurrentMonthLabel()}`
                : 'Organize sua agenda musical'}
            </p>
          </div>

          <Link
            href="/events/new"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/30 text-primary-foreground transition-all duration-200 active:scale-90"
            aria-label="Adicionar evento"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </motion.header>

        {/* ── EMPTY STATE ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!hasEvents && (
            <EmptyState onSeedDemo={seedDemo} />
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT (when events exist) ─────────────────────────────── */}
        {hasEvents && (
          <div className="space-y-5">

            {/* ── NEXT EVENT HERO ─────────────────────────────────────────── */}
            {nextEvent ? (
              <NextEventHero
                event={nextEvent}
                ticket={getTicketByEventId(nextEvent.id)}
                travel={getTravelByEventId(nextEvent.id)}
                lodging={getLodgingByEventId(nextEvent.id)}
                expenses={getExpensesByEventId(nextEvent.id)}
                checklist={getChecklistByEventId(nextEvent.id)}
              />
            ) : (
              /* No upcoming events — show a soft "all done" card */
              <motion.div
                custom={0}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-8 text-center ring-1 ring-emerald-200"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                  <CalendarDays className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Nenhum show por vir</p>
                  <p className="mt-1 text-sm text-emerald-700/70">
                    Todos os seus eventos foram concluídos. Que tal planejar o próximo?
                  </p>
                </div>
                <Link
                  href="/events/new"
                  className="mt-1 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Novo Evento
                </Link>
              </motion.div>
            )}

            {/* ── QUICK STATS ─────────────────────────────────────────────── */}
            <motion.section
              custom={0.1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
            >
              <QuickStats
                totalEvents={upcoming.length}
                totalSpent={totalSpent}
                cities={uniqueCities}
                pendingItems={0}
              />
            </motion.section>

            {/* ── PRÓXIMOS EVENTOS LIST ────────────────────────────────────── */}
            {nextEventsList.length > 0 && (
              <motion.section
                custom={0.18}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="space-y-3"
              >
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">
                    Próximos Eventos
                  </h2>
                  <Link
                    href="/events"
                    className="flex items-center gap-0.5 text-xs font-semibold text-primary"
                  >
                    Ver todos
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Cards */}
                <div className="space-y-2.5">
                  {nextEventsList.map((event, i) => (
                    <CompactEventCard key={event.id} event={event} index={i} />
                  ))}
                </div>

                {/* "Ver todos" footer link */}
                <Link
                  href="/events"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted py-3 text-sm font-semibold text-muted-foreground transition-all active:scale-[0.98]"
                >
                  Ver todos os eventos
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.section>
            )}

            {/* ── ANO POR MÊS ─────────────────────────────────────────────── */}
            <motion.section
              custom={0.26}
              initial="hidden"
              animate="show"
              variants={fadeUp}
            >
              <MonthStrip
                year={currentYear}
                events={events}
                onMonthSelect={(monthKey) => {
                  router.push(`/events?month=${monthKey}`)
                }}
              />
            </motion.section>

          </div>
        )}

        {/* Bottom navigation clearance */}
        <div className="mb-nav" />
      </div>
    </div>
  )
}

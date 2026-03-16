'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  CalendarDays,
  MapPin,
  DollarSign,
  Trophy,
  Calendar,
  Tag,
  ChevronRight,
  Sparkles,
  Clock,
} from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import { generateYearInsightsForYear } from '@/lib/domain/insights'
import { getUpcomingEvents, sortEventsByDate } from '@/lib/domain/events'
import { formatCurrency, formatDateLong, getMonthName } from '@/lib/formatters'
import { EXPENSE_CATEGORIES, EVENT_TYPES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { EventsMonthlyBarChart } from '@/components/expenses/expense-chart'
import type { EventType } from '@/types'
import { cn } from '@/lib/utils'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      delay,
    },
  }),
}

// ─── Event type colors ────────────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  show: '#7c3aed',
  festival: '#059669',
  convencao: '#d97706',
  outro: '#6b7280',
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  )
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

interface StatCellProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color?: string
}

function StatCell({ icon, label, value, sub, color = 'text-primary' }: StatCellProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border/50 shadow-sm">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10', color)}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground leading-none">{label}</p>
      <p className="text-base font-black text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  )
}

// ─── Insights Page ────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { events, expenses, loading } = useEventsStore()

  const currentYear = new Date().getFullYear()

  // ── Derived data ────────────────────────────────────────────────────────────
  const insights = useMemo(
    () => generateYearInsightsForYear(currentYear, { events, expenses }),
    [events, expenses, currentYear],
  )

  const yearEvents = useMemo(
    () => events.filter((e) => e.date.startsWith(String(currentYear))),
    [events, currentYear],
  )

  // Events per month for the bar chart
  const eventsByMonth = useMemo(() => {
    const result: Record<number, number> = {}
    for (let m = 1; m <= 12; m++) result[m] = 0
    for (const ev of yearEvents) {
      const month = parseInt(ev.date.slice(5, 7), 10)
      if (month >= 1 && month <= 12) result[month]++
    }
    return result
  }, [yearEvents])

  // Events by type
  const byType = useMemo(() => {
    const result: Record<EventType, number> = {
      show: 0,
      festival: 0,
      convencao: 0,
      outro: 0,
    }
    for (const ev of yearEvents) {
      result[ev.type] = (result[ev.type] ?? 0) + 1
    }
    return result
  }, [yearEvents])

  // Upcoming events (next 5)
  const upcomingEvents = useMemo(
    () => sortEventsByDate(getUpcomingEvents(events)).slice(0, 5),
    [events],
  )

  // Cities this year grouped by event
  const citiesByEvent = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const ev of yearEvents) {
      if (!ev.city || ev.status === 'cancelado' || ev.status === 'wishlist') continue
      const existing = map.get(ev.city) ?? []
      existing.push(ev.title)
      map.set(ev.city, existing)
    }
    return map
  }, [yearEvents])

  // Days until next event
  const nextEvent = useMemo(() => upcomingEvents[0] ?? null, [upcomingEvents])
  const daysUntilNext = useMemo(() => {
    if (!nextEvent) return null
    const eventDate = new Date(nextEvent.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [nextEvent])

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="safe-top" />
        <PageSkeleton />
      </div>
    )
  }

  const busiestMonthName = insights.busiestMonth
    ? getMonthName(parseInt(insights.busiestMonth.month.slice(5, 7), 10))
    : '—'

  const topCategoryLabel = insights.topExpenseCategory
    ? EXPENSE_CATEGORIES[insights.topExpenseCategory.category]?.label ?? '—'
    : '—'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />

      <PageHeader
        title="Insights"
        subtitle={`Ano ${currentYear}`}
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
        }
      />

      <div className="space-y-4 px-4 pb-6 pt-2">

        {/* ── YEAR SUMMARY ────────────────────────────────────────────────────── */}
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/90 to-amber-600 p-5 shadow-lg shadow-amber-500/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Resumo {currentYear}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-white">{insights.totalEvents}</p>
                <p className="text-[11px] font-medium text-white/70">Eventos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{insights.upcomingEvents}</p>
                <p className="text-[11px] font-medium text-white/70">Por Vir</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{insights.completedEvents}</p>
                <p className="text-[11px] font-medium text-white/70">Concluídos</p>
              </div>
            </div>
            {insights.totalSpent > 0 && (
              <div className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-center">
                <p className="text-xs text-white/70">Total investido</p>
                <p className="text-lg font-black text-white">
                  {formatCurrency(insights.totalSpent)}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── STAT GRID 2×3 ───────────────────────────────────────────────────── */}
        <motion.div custom={0.06} initial="hidden" animate="show" variants={fadeUp}>
          <div className="grid grid-cols-2 gap-3">
            <StatCell
              icon={<CalendarDays className="h-4 w-4" />}
              label="Shows no Ano"
              value={String(insights.totalEvents)}
            />
            <StatCell
              icon={<MapPin className="h-4 w-4" />}
              label="Cidades Visitadas"
              value={String(insights.citiesVisited.length)}
              sub={insights.citiesVisited.slice(0, 2).join(', ')}
            />
            <StatCell
              icon={<DollarSign className="h-4 w-4" />}
              label="Total Investido"
              value={formatCurrency(insights.totalSpent)}
            />
            <StatCell
              icon={<Trophy className="h-4 w-4" />}
              label="Evento Mais Caro"
              value={insights.mostExpensiveEvent?.event.title ?? '—'}
              sub={
                insights.mostExpensiveEvent
                  ? formatCurrency(insights.mostExpensiveEvent.total)
                  : undefined
              }
            />
            <StatCell
              icon={<Calendar className="h-4 w-4" />}
              label="Mês Mais Cheio"
              value={busiestMonthName}
              sub={
                insights.busiestMonth
                  ? `${insights.busiestMonth.count} evento${insights.busiestMonth.count !== 1 ? 's' : ''}`
                  : undefined
              }
            />
            <StatCell
              icon={<Tag className="h-4 w-4" />}
              label="Categoria Top"
              value={topCategoryLabel}
              sub={
                insights.topExpenseCategory
                  ? formatCurrency(insights.topExpenseCategory.total)
                  : undefined
              }
            />
          </div>
        </motion.div>

        {/* ── EVENTOS POR TIPO ─────────────────────────────────────────────────── */}
        <motion.div custom={0.12} initial="hidden" animate="show" variants={fadeUp}>
          <SectionCard title="Eventos por Tipo">
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.entries(byType) as [EventType, number][])
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const meta = EVENT_TYPES[type]
                  const color = EVENT_TYPE_COLORS[type]
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-3 rounded-xl p-3 ring-1"
                      style={{
                        backgroundColor: `${color}12`,
                        borderColor: `${color}30`,
                      }}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
                        <p className="text-lg font-black" style={{ color }}>
                          {count}
                        </p>
                      </div>
                    </div>
                  )
                })}
              {Object.values(byType).every((v) => v === 0) && (
                <div className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                  Nenhum evento cadastrado para {currentYear}
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── DISTRIBUIÇÃO POR MÊS – bar chart ────────────────────────────────── */}
        <motion.div custom={0.18} initial="hidden" animate="show" variants={fadeUp}>
          <SectionCard title="Distribuição por Mês">
            <EventsMonthlyBarChart data={eventsByMonth} />
          </SectionCard>
        </motion.div>

        {/* ── PRÓXIMOS – contagem e countdown ──────────────────────────────────── */}
        {nextEvent && (
          <motion.div custom={0.24} initial="hidden" animate="show" variants={fadeUp}>
            <SectionCard title="Próximo Evento">
              <div className="flex items-center gap-4 rounded-xl bg-primary/8 p-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-primary/15 px-4 py-3 text-center">
                  <p className="text-3xl font-black text-primary">
                    {daysUntilNext === 0 ? 'Hoje' : daysUntilNext === 1 ? '1' : daysUntilNext}
                  </p>
                  {daysUntilNext !== null && daysUntilNext > 1 && (
                    <p className="text-xs font-semibold text-primary/70">dias</p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate">{nextEvent.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDateLong(nextEvent.date)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nextEvent.city}, {nextEvent.state}
                  </p>
                </div>
                <Link
                  href={`/events/${nextEvent.id}`}
                  className="flex-shrink-0 rounded-xl bg-primary p-2.5 text-primary-foreground active:scale-90"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ── CIDADES ──────────────────────────────────────────────────────────── */}
        {citiesByEvent.size > 0 && (
          <motion.div custom={0.3} initial="hidden" animate="show" variants={fadeUp}>
            <SectionCard title={`Cidades em ${currentYear}`}>
              <div className="space-y-2.5">
                {Array.from(citiesByEvent.entries()).map(([city, eventTitles]) => (
                  <div
                    key={city}
                    className="flex items-start gap-3 rounded-xl bg-muted/40 px-3.5 py-3"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{city}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {eventTitles.join(', ')}
                      </p>
                    </div>
                    <span className="ml-auto flex-shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {eventTitles.length}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ── PRÓXIMOS EVENTOS – timeline ───────────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <motion.div custom={0.36} initial="hidden" animate="show" variants={fadeUp}>
            <SectionCard
              title="Agenda Próxima"
              action={
                <Link
                  href="/events"
                  className="flex items-center gap-0.5 text-xs font-semibold text-primary"
                >
                  Ver todos
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="relative space-y-0">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/60" />

                {upcomingEvents.map((ev, index) => {
                  const isLast = index === upcomingEvents.length - 1
                  const typeInfo = EVENT_TYPES[ev.type]
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const evDate = new Date(ev.date)
                  const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <Link
                      key={ev.id}
                      href={`/events/${ev.id}`}
                      className={cn(
                        'relative flex items-start gap-3 py-3 pl-7',
                        !isLast && 'border-b border-border/30',
                        'transition-colors active:bg-muted/30 rounded-xl',
                      )}
                    >
                      {/* Dot on timeline */}
                      <div
                        className="absolute left-0 top-[18px] flex h-5 w-5 -translate-y-0.5 items-center justify-center rounded-full border-2 border-background bg-primary/20"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {typeInfo.icon} {ev.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateLong(ev.date)}
                          </span>
                          <span>·</span>
                          <span>{ev.city}</span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'flex-shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold',
                          diffDays === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : diffDays === 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-primary/10 text-primary',
                        )}
                      >
                        {diffDays === 0
                          ? 'Hoje!'
                          : diffDays === 1
                            ? 'Amanhã!'
                            : `${diffDays}d`}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Empty state when no events at all */}
        {events.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10">
              <Sparkles className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Nenhum dado ainda</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Adicione eventos para ver seus insights e estatísticas aqui.
            </p>
            <Link
              href="/events/new"
              className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground active:scale-95"
            >
              Criar Evento
            </Link>
          </motion.div>
        )}

        <div className="mb-nav" />
      </div>
    </div>
  )
}

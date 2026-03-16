'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ChevronRight, TrendingUp, Receipt } from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import {
  getTotalExpensesForYear,
  getExpensesByCategory,
  getExpensesByMonth,
  getTopExpenseEvents,
  getAllProjectedExpenses,
} from '@/lib/domain/expenses'
import { formatCurrency } from '@/lib/formatters'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CategoryPieChart,
  MonthlyBarChart,
  CATEGORY_COLORS,
} from '@/components/expenses/expense-chart'
import type { ExpenseCategory } from '@/types'
import { cn } from '@/lib/utils'

// ─── Animation Variants ───────────────────────────────────────────────────────

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

// ─── Category order for display ───────────────────────────────────────────────

const CATEGORY_ORDER: ExpenseCategory[] = [
  'ingresso',
  'transporte',
  'hospedagem',
  'alimentacao',
  'merch',
  'extras',
  'outro',
]

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyExpenses() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center px-8 py-20 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <Receipt className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Nenhum gasto registrado</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Adicione gastos aos seus eventos para visualizar seu resumo financeiro aqui.
      </p>
      <Link
        href="/events"
        className="mt-6 flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground active:scale-95"
      >
        Ver Eventos
        <ChevronRight className="h-4 w-4" />
      </Link>
    </motion.div>
  )
}

// ─── Expenses Page ────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { events, expenses, tickets, travels, lodgings, loading, loadAll } = useEventsStore()

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ── Derived data ────────────────────────────────────────────────────────────
  const allExpenses = useMemo(
    () => getAllProjectedExpenses(expenses, tickets, travels, lodgings, events),
    [expenses, tickets, travels, lodgings, events],
  )

  const yearExpenses = useMemo(
    () => allExpenses.filter((e) => e.expenseDate.startsWith(String(currentYear))),
    [allExpenses, currentYear],
  )

  const totalForYear = useMemo(
    () => getTotalExpensesForYear(allExpenses, currentYear),
    [allExpenses, currentYear],
  )

  const byCategory = useMemo(
    () => getExpensesByCategory(yearExpenses),
    [yearExpenses],
  )

  const byMonth = useMemo(
    () => getExpensesByMonth(allExpenses, currentYear),
    [allExpenses, currentYear],
  )

  const topEvents = useMemo(
    () => getTopExpenseEvents(allExpenses, events).filter((e) => e.total > 0).slice(0, 10),
    [allExpenses, events],
  )

  const maxEventTotal = useMemo(
    () => topEvents.reduce((max, e) => Math.max(max, e.total), 0),
    [topEvents],
  )

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="safe-top" />
        <PageSkeleton />
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (allExpenses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="safe-top" />
        <PageHeader title="Gastos" subtitle={String(currentYear)} />
        <EmptyExpenses />
        <div className="mb-nav" />
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />

      <PageHeader
        title="Gastos"
        subtitle={String(currentYear)}
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        }
      />

      <div className="space-y-4 px-4 pb-6 pt-2">

        {/* ── TOTAL CARD ──────────────────────────────────────────────────────── */}
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 shadow-lg shadow-primary/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
              Total em {currentYear}
            </p>
            <p className="mt-1 text-4xl font-black tracking-tight text-primary-foreground">
              {formatCurrency(totalForYear)}
            </p>
            <p className="mt-2 text-xs text-primary-foreground/60">
              {allExpenses.length} {allExpenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}
            </p>
          </div>
        </motion.div>

        {/* ── BY CATEGORY – horizontal scroll ─────────────────────────────────── */}
        <motion.div custom={0.06} initial="hidden" animate="show" variants={fadeUp}>
          <SectionCard title="Por Categoria">
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {CATEGORY_ORDER.map((cat) => {
                const meta = EXPENSE_CATEGORIES[cat]
                const amount = byCategory[cat] ?? 0
                const color = CATEGORY_COLORS[cat]
                const pct = totalForYear > 0 ? (amount / totalForYear) * 100 : 0

                return (
                  <div
                    key={cat}
                    className="flex-shrink-0 min-w-[110px] rounded-xl p-3 ring-1"
                    style={{
                      backgroundColor: `${color}15`,
                      borderColor: `${color}30`,
                    }}
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <p
                      className="mt-1.5 text-xs font-semibold"
                      style={{ color }}
                    >
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-foreground">
                      {formatCurrency(amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pct.toFixed(0)}%
                    </p>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── DONUT CHART ─────────────────────────────────────────────────────── */}
        <motion.div custom={0.12} initial="hidden" animate="show" variants={fadeUp}>
          <SectionCard title="Distribuição">
            <CategoryPieChart data={byCategory} />
            {/* Legend */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {CATEGORY_ORDER.filter((cat) => (byCategory[cat] ?? 0) > 0).map((cat) => {
                const meta = EXPENSE_CATEGORIES[cat]
                const color = CATEGORY_COLORS[cat]
                const pct = totalForYear > 0
                  ? ((byCategory[cat] ?? 0) / totalForYear * 100).toFixed(0)
                  : '0'
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-xs text-muted-foreground">
                      {meta.icon} {meta.label}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-foreground">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── BY MONTH – bar chart ─────────────────────────────────────────────── */}
        <motion.div custom={0.18} initial="hidden" animate="show" variants={fadeUp}>
          <SectionCard title="Por Mês">
            <MonthlyBarChart data={byMonth} year={currentYear} />
          </SectionCard>
        </motion.div>

        {/* ── BY EVENT ────────────────────────────────────────────────────────── */}
        {topEvents.length > 0 && (
          <motion.div custom={0.24} initial="hidden" animate="show" variants={fadeUp}>
            <SectionCard title="Por Evento">
              <div className="space-y-3">
                {topEvents.map(({ event, total }) => {
                  const pct = maxEventTotal > 0 ? (total / maxEventTotal) * 100 : 0
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="group flex flex-col gap-1.5 rounded-xl p-3 ring-1 ring-border/50 transition-all active:scale-[0.98] active:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.city} · {event.date.slice(0, 4)}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(total)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-active:translate-x-0.5" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </SectionCard>
          </motion.div>
        )}

        <div className="mb-nav" />
      </div>
    </div>
  )
}

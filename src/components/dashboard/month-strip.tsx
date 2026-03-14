'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Event } from '@/types'
import { getShortMonthName } from '@/lib/formatters'
import { getEventsForMonth } from '@/lib/domain/events'
import { EVENT_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface MonthStripProps {
  year: number
  events: Event[]
  onMonthSelect?: (month: string) => void
}

// ─── Month Dot Colors ─────────────────────────────────────────────────────────

const TYPE_DOT_COLORS: Record<string, string> = {
  show: 'bg-purple-500',
  festival: 'bg-pink-500',
  convencao: 'bg-amber-500',
  outro: 'bg-sky-500',
}

// ─── Month Chip ───────────────────────────────────────────────────────────────

interface MonthChipProps {
  month: number
  year: number
  events: Event[]
  isCurrentMonth: boolean
  onSelect?: (monthKey: string) => void
  delay: number
}

function MonthChip({ month, year, events, isCurrentMonth, onSelect, delay }: MonthChipProps) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthEvents = getEventsForMonth(events, year, month)
  const hasEvents = monthEvents.length > 0
  const shortName = getShortMonthName(month)

  // Limit visible dots to 4
  const dotsToShow = monthEvents.slice(0, 4)

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      onClick={() => onSelect?.(monthKey)}
      data-month={monthKey}
      className={cn(
        'flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-200 active:scale-95',
        hasEvents
          ? isCurrentMonth
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
            : 'bg-primary/10 text-primary ring-1 ring-primary/20'
          : isCurrentMonth
            ? 'bg-muted text-foreground ring-2 ring-primary/40'
            : 'bg-muted/50 text-muted-foreground',
      )}
    >
      {/* Month abbreviation */}
      <span className={cn(
        'text-sm font-bold leading-none',
        hasEvents ? 'font-extrabold' : 'font-medium',
      )}>
        {shortName}
      </span>

      {/* Event count or dash */}
      <span className={cn(
        'text-[11px] font-semibold leading-none',
        hasEvents
          ? isCurrentMonth
            ? 'text-primary-foreground/80'
            : 'text-primary/70'
          : 'text-muted-foreground/50',
      )}>
        {hasEvents ? `${monthEvents.length}` : '—'}
      </span>

      {/* Event type dots */}
      <div className="flex items-center gap-0.5" style={{ minHeight: '6px' }}>
        {dotsToShow.map((ev) => (
          <span
            key={ev.id}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isCurrentMonth
                ? 'bg-primary-foreground/80'
                : (TYPE_DOT_COLORS[ev.type] ?? 'bg-primary'),
            )}
            title={EVENT_TYPES[ev.type]?.label}
          />
        ))}
        {monthEvents.length > 4 && (
          <span className={cn(
            'text-[8px] font-bold leading-none',
            isCurrentMonth ? 'text-primary-foreground/70' : 'text-primary/60',
          )}>
            +{monthEvents.length - 4}
          </span>
        )}
      </div>
    </motion.button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MonthStrip({ year, events, onMonthSelect }: MonthStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-based
  const currentYear = now.getFullYear()

  // Auto-scroll to current month on mount
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const targetMonth = year === currentYear ? currentMonth : 1
    const targetKey = `${year}-${String(targetMonth).padStart(2, '0')}`
    const chip = container.querySelector(`[data-month="${targetKey}"]`) as HTMLElement | null

    if (chip) {
      // Center the chip in the scroll container
      const chipLeft = chip.offsetLeft
      const chipWidth = chip.offsetWidth
      const containerWidth = container.clientWidth
      const scrollTo = chipLeft - containerWidth / 2 + chipWidth / 2
      container.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' })
    }
  }, [year, currentYear, currentMonth])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-base font-bold text-foreground">{year}</h3>
        <p className="text-xs font-medium text-muted-foreground">
          {events.filter((e) => e.date.startsWith(String(year))).length} eventos no ano
        </p>
      </div>

      {/* Scrollable month strip — scrollbar hidden */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {months.map((month, idx) => {
          const isCurrentMonth =
            year === currentYear && month === currentMonth

          return (
            <MonthChip
              key={month}
              month={month}
              year={year}
              events={events}
              isCurrentMonth={isCurrentMonth}
              onSelect={onMonthSelect}
              delay={idx * 0.03}
            />
          )
        })}
      </div>
    </div>
  )
}

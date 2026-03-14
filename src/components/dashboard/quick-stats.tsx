'use client'

import { motion } from 'framer-motion'
import { Calendar, Banknote, MapPin, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuickStatsProps {
  totalEvents: number
  totalSpent: number
  cities: string[]
  pendingItems: number
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  accent?: string
  delay?: number
}

function StatCard({ icon, value, label, accent = 'bg-primary/10 text-primary', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
      className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-card p-3.5 shadow-sm ring-1 ring-border/60"
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
        {icon}
      </div>
      <div className="text-center">
        <p className="text-lg font-black leading-none tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickStats({ totalEvents, totalSpent, cities, pendingItems }: QuickStatsProps) {
  const formattedSpent = totalSpent === 0
    ? 'R$ 0'
    : formatCurrency(totalSpent)

  const citiesCount = cities.length

  return (
    <div className="flex gap-3">
      <StatCard
        icon={<Calendar className="h-4.5 w-4.5" />}
        value={String(totalEvents)}
        label={totalEvents === 1 ? 'Show' : 'Shows'}
        accent="bg-primary/10 text-primary"
        delay={0}
      />
      <StatCard
        icon={<Banknote className="h-4.5 w-4.5" />}
        value={formattedSpent}
        label="Investido"
        accent="bg-emerald-500/10 text-emerald-600"
        delay={0.05}
      />
      <StatCard
        icon={<MapPin className="h-4.5 w-4.5" />}
        value={String(citiesCount)}
        label={citiesCount === 1 ? 'Cidade' : 'Cidades'}
        accent="bg-sky-500/10 text-sky-600"
        delay={0.1}
      />
    </div>
  )
}

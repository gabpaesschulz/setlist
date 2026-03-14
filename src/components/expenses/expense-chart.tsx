'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ExpenseCategory } from '@/types'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatCurrency, getShortMonthName } from '@/lib/formatters'

// ─── Category Colors ──────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ingresso: '#7c3aed',
  transporte: '#2563eb',
  hospedagem: '#059669',
  alimentacao: '#d97706',
  merch: '#dc2626',
  extras: '#9f7aea',
  outro: '#6b7280',
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface PieTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground mt-0.5">{formatCurrency(item.value)}</p>
    </div>
  )
}

interface BarTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground mt-0.5">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── Category Pie Chart ───────────────────────────────────────────────────────

interface CategoryPieChartProps {
  data: Record<string, number>
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = (Object.entries(data) as [ExpenseCategory, number][])
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: EXPENSE_CATEGORIES[category]?.label ?? category,
      value,
      color: CATEGORY_COLORS[category] ?? '#6b7280',
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">Nenhum gasto registrado</p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Monthly Bar Chart ────────────────────────────────────────────────────────

interface MonthlyBarChartProps {
  data: Record<number, number>
  year: number
}

export function MonthlyBarChart({ data, year: _year }: MonthlyBarChartProps) {
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: getShortMonthName(i + 1),
    value: data[i + 1] ?? 0,
  }))

  return (
    <div className="w-full" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barSize={14}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip content={<BarTooltip />} cursor={{ opacity: 0.08 }} />
          <Bar
            dataKey="value"
            fill="#7c3aed"
            radius={[4, 4, 0, 0]}
            opacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Events Bar Chart (for insights) ─────────────────────────────────────────

interface EventsMonthlyBarChartProps {
  data: Record<number, number>
}

interface EventsBarTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function EventsBarTooltip({ active, payload, label }: EventsBarTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground mt-0.5">
        {payload[0].value} {payload[0].value === 1 ? 'evento' : 'eventos'}
      </p>
    </div>
  )
}

export function EventsMonthlyBarChart({ data }: EventsMonthlyBarChartProps) {
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: getShortMonthName(i + 1),
    value: data[i + 1] ?? 0,
  }))

  return (
    <div className="w-full" style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          barSize={14}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<EventsBarTooltip />} cursor={{ opacity: 0.08 }} />
          <Bar
            dataKey="value"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
            opacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

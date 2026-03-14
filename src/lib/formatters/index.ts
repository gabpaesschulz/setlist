import {
  format,
  parseISO,
  isValid,
  parse,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Formats a number as Brazilian Real currency.
 * Example: 1500.5 → "R$ 1.500,50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/**
 * Safely parse an ISO date string or datetime string into a Date object.
 * Returns null when the string is empty or results in an invalid date.
 */
function safeParse(dateStr: string): Date | null {
  if (!dateStr) return null

  // Try ISO datetime first (includes time component)
  let date = parseISO(dateStr)
  if (isValid(date)) return date

  // Fallback: plain date string without timezone, e.g. "2026-03-14"
  date = parse(dateStr, 'yyyy-MM-dd', new Date())
  if (isValid(date)) return date

  return null
}

// ─── Date Formatters ──────────────────────────────────────────────────────────

/**
 * Formats a date string as dd/MM/yyyy.
 * Example: "2026-03-14" → "14/03/2026"
 */
export function formatDate(dateStr: string): string {
  const date = safeParse(dateStr)
  if (!date) return dateStr
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Formats a date string in long Brazilian Portuguese format.
 * Example: "2026-03-14" → "14 de março de 2026"
 */
export function formatDateLong(dateStr: string): string {
  const date = safeParse(dateStr)
  if (!date) return dateStr
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Formats a date string as short date with time.
 * Example: "2026-03-14T20:00:00" → "14/03 às 20:00"
 * When a separate timeStr is provided it overrides the time from dateStr.
 */
export function formatDateTime(dateStr: string, timeStr?: string): string {
  const date = safeParse(dateStr)
  if (!date) return dateStr

  const datePart = format(date, 'dd/MM', { locale: ptBR })

  if (timeStr) {
    return `${datePart} às ${timeStr}`
  }

  // Only show time component when the original string contained one
  const hasTime = dateStr.includes('T') || dateStr.includes(' ')
  if (hasTime) {
    const timePart = format(date, 'HH:mm', { locale: ptBR })
    return `${datePart} às ${timePart}`
  }

  return datePart
}

/**
 * Formats a date string as month and year in Portuguese.
 * Example: "2026-03-14" → "Março 2026"
 */
export function formatMonthYear(dateStr: string): string {
  const date = safeParse(dateStr)
  if (!date) return dateStr
  return format(date, 'MMMM yyyy', { locale: ptBR })
    .replace(/^\w/, (c) => c.toUpperCase())
}

// ─── Month Names ──────────────────────────────────────────────────────────────

const MONTH_NAMES: string[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const SHORT_MONTH_NAMES: string[] = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/**
 * Returns the full Portuguese month name for a 1-based month number.
 * Example: getMonthName(3) → "Março"
 */
export function getMonthName(month: number): string {
  if (month < 1 || month > 12) return ''
  return MONTH_NAMES[month - 1]
}

/**
 * Returns the short Portuguese month name for a 1-based month number.
 * Example: getShortMonthName(3) → "Mar"
 */
export function getShortMonthName(month: number): string {
  if (month < 1 || month > 12) return ''
  return SHORT_MONTH_NAMES[month - 1]
}

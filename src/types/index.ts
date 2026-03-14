// ─── Enums ────────────────────────────────────────────────────────────────────

export type EventType = 'show' | 'festival' | 'convencao' | 'outro'

export type EventStatus = 'ativo' | 'concluido' | 'cancelado' | 'wishlist'

export type TransportType =
  | 'onibus'
  | 'excursao'
  | 'aviao'
  | 'carro'
  | 'carona'
  | 'trem'
  | 'outro'

export type ExpenseCategory =
  | 'ingresso'
  | 'transporte'
  | 'hospedagem'
  | 'alimentacao'
  | 'merch'
  | 'extras'
  | 'outro'

export type PurchaseType = 'inteira' | 'meia' | 'social' | 'cortesia' | 'outro'

export type ReadinessLevel = 'em_aberto' | 'organizando' | 'quase_pronto' | 'pronto'

// ─── Core Domain Models ───────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  artist: string
  type: EventType
  status: EventStatus
  date: string // ISO date string e.g. "2026-03-14"
  endDate?: string
  time?: string
  city: string
  state: string
  venue: string
  notes?: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Ticket {
  id: string
  eventId: string
  sector: string
  ticketType: string
  purchaseType: PurchaseType
  provider: string
  price: number
  fee: number
  purchased: boolean
  orderCode?: string
  ticketUrl?: string
  notes?: string
}

export interface Travel {
  id: string
  eventId: string
  transportType: TransportType
  company?: string
  booked: boolean
  departureLocation: string
  arrivalLocation: string
  outboundDateTime?: string
  returnDateTime?: string
  locatorCode?: string
  notes?: string
  bookingUrl?: string
}

export interface Lodging {
  id: string
  eventId: string
  required: boolean
  name?: string
  address?: string
  checkIn?: string
  checkOut?: string
  price?: number
  confirmed: boolean
  bookingUrl?: string
  notes?: string
}

export interface Expense {
  id: string
  eventId: string
  category: ExpenseCategory
  amount: number
  description: string
  expenseDate: string
  createdAt: string
}

export interface ItineraryItem {
  id: string
  eventId: string
  order: number
  dateTime?: string
  title: string
  description?: string
  done: boolean
}

export interface ChecklistItem {
  id: string
  eventId: string
  label: string
  done: boolean
  isDefault: boolean
  order: number
}

export interface EventReflection {
  id: string
  eventId: string
  rating: number // 1–5
  notes?: string
  favoriteMoment?: string
  worthIt: boolean
  createdAt: string
}

// ─── Composite / Derived Types ────────────────────────────────────────────────

export interface EventWithRelations {
  event: Event
  ticket?: Ticket
  travel?: Travel
  lodging?: Lodging
  expenses: Expense[]
  itinerary: ItineraryItem[]
  checklist: ChecklistItem[]
  reflection?: EventReflection
}

export interface ReadinessScore {
  score: number
  level: ReadinessLevel
  label: string
}

// ─── Filter / Query Types ─────────────────────────────────────────────────────

export interface EventFilters {
  city?: string
  type?: EventType
  status?: EventStatus
  month?: string // "2026-03"
  upcoming?: boolean
  past?: boolean
}

// ─── Insight Types ────────────────────────────────────────────────────────────

export interface YearInsights {
  totalEvents: number
  upcomingEvents: number
  pastEvents: number
  completedEvents: number
  totalSpent: number
  citiesVisited: string[]
  mostExpensiveEvent: { event: Event; total: number } | null
  busiestMonth: { month: string; count: number } | null
  topExpenseCategory: { category: ExpenseCategory; total: number } | null
}

// ─── Countdown Types ──────────────────────────────────────────────────────────

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  label: string
  isPast: boolean
  isToday: boolean
  isTomorrow: boolean
}

import { z } from 'zod'

// ─── Enum Schemas ─────────────────────────────────────────────────────────────

export const eventTypeSchema = z.enum(['show', 'festival', 'convencao', 'outro'])

export const eventStatusSchema = z.enum(['ativo', 'concluido', 'cancelado', 'wishlist'])

export const transportTypeSchema = z.enum([
  'onibus',
  'excursao',
  'aviao',
  'carro',
  'carona',
  'trem',
  'outro',
])

export const expenseCategorySchema = z.enum([
  'ingresso',
  'transporte',
  'hospedagem',
  'alimentacao',
  'merch',
  'extras',
  'outro',
])

export const purchaseTypeSchema = z.enum(['inteira', 'meia', 'social', 'cortesia', 'outro'])

export const readinessLevelSchema = z.enum(['em_aberto', 'organizando', 'quase_pronto', 'pronto'])

// ─── Event Schema ─────────────────────────────────────────────────────────────

export const eventSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  artist: z.string().min(1, 'Artista é obrigatório').max(200, 'Nome do artista muito longo'),
  type: eventTypeSchema,
  status: eventStatusSchema,
  date: z
    .string()
    .min(1, 'Data é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM')
    .optional(),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Nome da cidade muito longo'),
  state: z
    .string()
    .min(2, 'Estado é obrigatório')
    .max(2, 'Use a sigla do estado (ex: SP)')
    .toUpperCase(),
  venue: z.string().min(1, 'Local é obrigatório').max(200, 'Nome do local muito longo'),
  notes: z.string().max(2000, 'Notas muito longas').optional(),
  coverImage: z.string().url('URL da imagem inválida').optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
})

export type EventSchema = z.infer<typeof eventSchema>

// ─── Ticket Schema ────────────────────────────────────────────────────────────

export const ticketSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  sector: z.string().min(1, 'Setor é obrigatório').max(100),
  ticketType: z.string().min(1, 'Tipo de ingresso é obrigatório').max(100),
  purchaseType: purchaseTypeSchema,
  provider: z.string().min(1, 'Fornecedor é obrigatório').max(100),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  fee: z.number().min(0, 'Taxa não pode ser negativa'),
  purchased: z.boolean(),
  orderCode: z.string().max(100).optional(),
  ticketUrl: z.string().url('URL inválida').optional(),
  notes: z.string().max(1000).optional(),
})

export type TicketSchema = z.infer<typeof ticketSchema>

// ─── Travel Schema ────────────────────────────────────────────────────────────

export const travelSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  transportType: transportTypeSchema,
  company: z.string().max(100).optional(),
  booked: z.boolean(),
  departureLocation: z.string().min(1, 'Local de partida é obrigatório').max(200),
  arrivalLocation: z.string().min(1, 'Local de chegada é obrigatório').max(200),
  outboundDateTime: z.string().optional(),
  returnDateTime: z.string().optional(),
  locatorCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  bookingUrl: z.string().url('URL inválida').optional(),
})

export type TravelSchema = z.infer<typeof travelSchema>

// ─── Lodging Schema ───────────────────────────────────────────────────────────

export const lodgingSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  required: z.boolean(),
  name: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  price: z.number().min(0, 'Preço não pode ser negativo').optional(),
  confirmed: z.boolean(),
  bookingUrl: z.string().url('URL inválida').optional(),
  notes: z.string().max(1000).optional(),
})

export type LodgingSchema = z.infer<typeof lodgingSchema>

// ─── Expense Schema ───────────────────────────────────────────────────────────

export const expenseSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  category: expenseCategorySchema,
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória').max(300),
  expenseDate: z
    .string()
    .min(1, 'Data da despesa é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  createdAt: z.string(),
})

export type ExpenseSchema = z.infer<typeof expenseSchema>

// ─── Itinerary Item Schema ────────────────────────────────────────────────────

export const itineraryItemSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  order: z.number().int().min(0),
  dateTime: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(1000).optional(),
  done: z.boolean(),
})

export type ItineraryItemSchema = z.infer<typeof itineraryItemSchema>

// ─── Checklist Item Schema ────────────────────────────────────────────────────

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  label: z.string().min(1, 'Label é obrigatório').max(200),
  done: z.boolean(),
  isDefault: z.boolean(),
  order: z.number().int().min(0),
})

export type ChecklistItemSchema = z.infer<typeof checklistItemSchema>

// ─── Event Reflection Schema ──────────────────────────────────────────────────

export const eventReflectionSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
  rating: z
    .number()
    .int('Avaliação deve ser um número inteiro')
    .min(1, 'Avaliação mínima é 1')
    .max(5, 'Avaliação máxima é 5'),
  notes: z.string().max(2000).optional(),
  favoriteMoment: z.string().max(500).optional(),
  worthIt: z.boolean(),
  createdAt: z.string(),
})

export type EventReflectionSchema = z.infer<typeof eventReflectionSchema>

export const backupDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().min(1),
  events: z.array(eventSchema).default([]),
  tickets: z.array(ticketSchema).default([]),
  travels: z.array(travelSchema).default([]),
  lodgings: z.array(lodgingSchema).default([]),
  expenses: z.array(expenseSchema).default([]),
  itinerary: z.array(itineraryItemSchema).default([]),
  checklist: z.array(checklistItemSchema).default([]),
  reflections: z.array(eventReflectionSchema).default([]),
})

export type BackupDataSchema = z.infer<typeof backupDataSchema>

// ─── Event Form Schema (creation / editing form) ──────────────────────────────
// Combines core event fields with optional ticket, travel, and lodging fields.
// IDs and timestamps are excluded from the form — they are generated at save time.

export const eventFormSchema = z.object({
  // ── Event core ──────────────────────────────────────────────────────────────
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  artist: z.string().min(1, 'Artista é obrigatório').max(200, 'Nome do artista muito longo'),
  type: eventTypeSchema,
  status: eventStatusSchema,
  date: z
    .string()
    .min(1, 'Data é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM')
    .optional()
    .or(z.literal('')),
  city: z.string().min(1, 'Cidade é obrigatória').max(100),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado (ex: SP)'),
  venue: z.string().min(1, 'Local é obrigatório').max(200),
  notes: z.string().max(2000).optional(),
  coverImage: z.string().url('URL da imagem inválida').optional().or(z.literal('')),

  // ── Ticket (optional block) ─────────────────────────────────────────────────
  ticket: z
    .object({
      sector: z.string().max(100).optional().or(z.literal('')),
      ticketType: z.string().max(100).optional().or(z.literal('')),
      purchaseType: purchaseTypeSchema.default('inteira'),
      provider: z.string().max(100).optional().or(z.literal('')),
      price: z.number().min(0).default(0),
      fee: z.number().min(0).default(0),
      purchased: z.boolean().default(false),
      orderCode: z.string().max(100).optional().or(z.literal('')),
      ticketUrl: z.string().url('URL inválida').optional().or(z.literal('')),
      notes: z.string().max(1000).optional(),
    })
    .optional(),

  // ── Travel (optional block) ─────────────────────────────────────────────────
  travel: z
    .object({
      transportType: transportTypeSchema.default('onibus'),
      company: z.string().max(100).optional().or(z.literal('')),
      booked: z.boolean().default(false),
      departureLocation: z.string().max(200).optional().or(z.literal('')),
      arrivalLocation: z.string().max(200).optional().or(z.literal('')),
      outboundDateTime: z.string().optional().or(z.literal('')),
      returnDateTime: z.string().optional().or(z.literal('')),
      locatorCode: z.string().max(50).optional().or(z.literal('')),
      notes: z.string().max(1000).optional(),
      bookingUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    })
    .optional(),

  // ── Lodging (optional block) ────────────────────────────────────────────────
  lodging: z
    .object({
      required: z.boolean().default(false),
      name: z.string().max(200).optional().or(z.literal('')),
      address: z.string().max(300).optional().or(z.literal('')),
      checkIn: z.string().optional().or(z.literal('')),
      checkOut: z.string().optional().or(z.literal('')),
      price: z.number().min(0).optional(),
      confirmed: z.boolean().default(false),
      bookingUrl: z.string().url('URL inválida').optional().or(z.literal('')),
      notes: z.string().max(1000).optional(),
    })
    .optional(),
})

export type EventFormSchema = z.infer<typeof eventFormSchema>

// ─── Convenience form-only input schemas (without generated fields) ───────────

export const ticketFormSchema = ticketSchema.omit({ id: true, eventId: true })
export type TicketFormSchema = z.infer<typeof ticketFormSchema>

export const travelFormSchema = travelSchema.omit({ id: true, eventId: true })
export type TravelFormSchema = z.infer<typeof travelFormSchema>

export const lodgingFormSchema = lodgingSchema.omit({ id: true, eventId: true })
export type LodgingFormSchema = z.infer<typeof lodgingFormSchema>

export const expenseFormSchema = expenseSchema.omit({ id: true, eventId: true, createdAt: true })
export type ExpenseFormSchema = z.infer<typeof expenseFormSchema>

export const itineraryItemFormSchema = itineraryItemSchema.omit({ id: true, eventId: true })
export type ItineraryItemFormSchema = z.infer<typeof itineraryItemFormSchema>

export const checklistItemFormSchema = checklistItemSchema.omit({ id: true, eventId: true })
export type ChecklistItemFormSchema = z.infer<typeof checklistItemFormSchema>

export const eventReflectionFormSchema = eventReflectionSchema.omit({
  id: true,
  eventId: true,
  createdAt: true,
})
export type EventReflectionFormSchema = z.infer<typeof eventReflectionFormSchema>

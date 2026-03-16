import { create } from 'zustand'
import type {
  Event,
  Ticket,
  Travel,
  Lodging,
  Expense,
  ItineraryItem,
  ChecklistItem,
  EventReflection,
  EventWithRelations,
} from '@/types'
import {
  getAllEvents,
  createEvent,
  updateEvent as dbUpdateEvent,
  deleteEvent as dbDeleteEvent,
  upsertTicket as dbUpsertTicket,
  upsertTravel as dbUpsertTravel,
  upsertLodging as dbUpsertLodging,
  createExpense,
  updateExpense as dbUpdateExpense,
  deleteExpense as dbDeleteExpense,
  createItineraryItem,
  updateItineraryItem as dbUpdateItineraryItem,
  deleteItineraryItem as dbDeleteItineraryItem,
  createChecklistItem,
  updateChecklistItem as dbUpdateChecklistItem,
  deleteChecklistItem as dbDeleteChecklistItem,
  upsertReflection as dbUpsertReflection,
  seedDemoData,
  exportAllData,
  getBackupImportPreview,
  importAllData,
  importDataByEventIds,
  resetAllData,
  type BackupImportPreviewItem,
  db,
} from '@/lib/db'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface EventsState {
  events: Event[]
  tickets: Ticket[]
  travels: Travel[]
  lodgings: Lodging[]
  expenses: Expense[]
  itinerary: ItineraryItem[]
  checklist: ChecklistItem[]
  reflections: EventReflection[]
  loading: boolean
  error: string | null

  // ─── Actions ──────────────────────────────────────────────────────────
  loadAll: () => Promise<void>
  addEvent: (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Event>
  updateEvent: (id: string, data: Partial<Event>) => Promise<Event>
  deleteEvent: (id: string) => Promise<void>
  duplicateEvent: (id: string) => Promise<Event>
  completeEvent: (id: string) => Promise<Event>

  upsertTicket: (data: Omit<Ticket, 'id'> & { id?: string }) => Promise<Ticket>
  upsertTravel: (data: Omit<Travel, 'id'> & { id?: string }) => Promise<Travel>
  upsertLodging: (data: Omit<Lodging, 'id'> & { id?: string }) => Promise<Lodging>

  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<Expense>
  deleteExpense: (id: string) => Promise<void>

  addItineraryItem: (data: Omit<ItineraryItem, 'id'>) => Promise<ItineraryItem>
  updateItineraryItem: (id: string, data: Partial<ItineraryItem>) => Promise<ItineraryItem>
  deleteItineraryItem: (id: string) => Promise<void>

  addChecklistItem: (data: Omit<ChecklistItem, 'id'>) => Promise<ChecklistItem>
  updateChecklistItem: (id: string, data: Partial<ChecklistItem>) => Promise<ChecklistItem>
  deleteChecklistItem: (id: string) => Promise<void>

  upsertReflection: (data: Omit<EventReflection, 'id'> & { id?: string }) => Promise<EventReflection>

  seedDemo: () => Promise<void>
  exportData: () => Promise<string>
  previewImportData: (json: string) => Promise<BackupImportPreviewItem[]>
  importData: (json: string) => Promise<void>
  importDataByEvents: (json: string, eventIds: string[]) => Promise<void>
  resetData: () => Promise<void>

  // ─── Computed Selectors ───────────────────────────────────────────────
  getEventById: (id: string) => Event | undefined
  getTicketByEventId: (id: string) => Ticket | undefined
  getTravelByEventId: (id: string) => Travel | undefined
  getLodgingByEventId: (id: string) => Lodging | undefined
  getExpensesByEventId: (id: string) => Expense[]
  getItineraryByEventId: (id: string) => ItineraryItem[]
  getChecklistByEventId: (id: string) => ChecklistItem[]
  getReflectionByEventId: (id: string) => EventReflection | undefined
  getEventWithRelations: (id: string) => EventWithRelations | null
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  tickets: [],
  travels: [],
  lodgings: [],
  expenses: [],
  itinerary: [],
  checklist: [],
  reflections: [],
  loading: false,
  error: null,

  // ─── Load All ───────────────────────────────────────────────────────────────

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [events, tickets, travels, lodgings, expenses, itinerary, checklist, reflections] =
        await Promise.all([
          db.events.orderBy('date').toArray(),
          db.tickets.toArray(),
          db.travels.toArray(),
          db.lodgings.toArray(),
          db.expenses.toArray(),
          db.itinerary.toArray(),
          db.checklist.toArray(),
          db.reflections.toArray(),
        ])
      set({ events, tickets, travels, lodgings, expenses, itinerary, checklist, reflections, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  // ─── Events ─────────────────────────────────────────────────────────────────

  addEvent: async (data) => {
    const event = await createEvent(data)
    set((state) => ({ events: [...state.events, event].sort((a, b) => a.date.localeCompare(b.date)) }))
    return event
  },

  updateEvent: async (id, data) => {
    const updated = await dbUpdateEvent(id, data)
    set((state) => ({
      events: state.events
        .map((e) => (e.id === id ? updated : e))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    return updated
  },

  deleteEvent: async (id) => {
    await dbDeleteEvent(id)
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      tickets: state.tickets.filter((t) => t.eventId !== id),
      travels: state.travels.filter((t) => t.eventId !== id),
      lodgings: state.lodgings.filter((l) => l.eventId !== id),
      expenses: state.expenses.filter((e) => e.eventId !== id),
      itinerary: state.itinerary.filter((i) => i.eventId !== id),
      checklist: state.checklist.filter((c) => c.eventId !== id),
      reflections: state.reflections.filter((r) => r.eventId !== id),
    }))
  },

  duplicateEvent: async (id) => {
    const { events, checklist } = get()
    const original = events.find((e) => e.id === id)
    if (!original) throw new Error(`Event not found: ${id}`)

    const newEvent = await createEvent({
      title: `${original.title} (cópia)`,
      artist: original.artist,
      type: original.type,
      status: original.status,
      date: original.date,
      endDate: original.endDate,
      time: original.time,
      city: original.city,
      state: original.state,
      venue: original.venue,
      notes: original.notes,
      coverImage: original.coverImage,
    })

    // Duplicate checklist items for the new event
    const originalChecklist = checklist.filter((c) => c.eventId === id)
    const newChecklistItems: ChecklistItem[] = []
    for (const item of originalChecklist) {
      const newItem = await createChecklistItem({
        eventId: newEvent.id,
        label: item.label,
        done: false,
        isDefault: item.isDefault,
        order: item.order,
      })
      newChecklistItems.push(newItem)
    }

    set((state) => ({
      events: [...state.events, newEvent].sort((a, b) => a.date.localeCompare(b.date)),
      checklist: [...state.checklist, ...newChecklistItems],
    }))

    return newEvent
  },

  completeEvent: async (id) => {
    const updated = await dbUpdateEvent(id, {
      status: 'concluido',
      completedAt: new Date().toISOString(),
    })
    set((state) => ({
      events: state.events
        .map((e) => (e.id === id ? updated : e))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    return updated
  },

  // ─── Ticket ─────────────────────────────────────────────────────────────────

  upsertTicket: async (data) => {
    const ticket = await dbUpsertTicket(data)
    set((state) => {
      const exists = state.tickets.some((t) => t.id === ticket.id)
      return {
        tickets: exists
          ? state.tickets.map((t) => (t.id === ticket.id ? ticket : t))
          : [...state.tickets, ticket],
      }
    })
    return ticket
  },

  // ─── Travel ─────────────────────────────────────────────────────────────────

  upsertTravel: async (data) => {
    const travel = await dbUpsertTravel(data)
    set((state) => {
      const exists = state.travels.some((t) => t.id === travel.id)
      return {
        travels: exists
          ? state.travels.map((t) => (t.id === travel.id ? travel : t))
          : [...state.travels, travel],
      }
    })
    return travel
  },

  // ─── Lodging ────────────────────────────────────────────────────────────────

  upsertLodging: async (data) => {
    const lodging = await dbUpsertLodging(data)
    set((state) => {
      const exists = state.lodgings.some((l) => l.id === lodging.id)
      return {
        lodgings: exists
          ? state.lodgings.map((l) => (l.id === lodging.id ? lodging : l))
          : [...state.lodgings, lodging],
      }
    })
    return lodging
  },

  // ─── Expenses ───────────────────────────────────────────────────────────────

  addExpense: async (data) => {
    const expense = await createExpense(data)
    set((state) => ({ expenses: [...state.expenses, expense] }))
    return expense
  },

  updateExpense: async (id, data) => {
    const updated = await dbUpdateExpense(id, data)
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
    }))
    return updated
  },

  deleteExpense: async (id) => {
    await dbDeleteExpense(id)
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }))
  },

  // ─── Itinerary ──────────────────────────────────────────────────────────────

  addItineraryItem: async (data) => {
    const item = await createItineraryItem(data)
    set((state) => ({ itinerary: [...state.itinerary, item] }))
    return item
  },

  updateItineraryItem: async (id, data) => {
    const updated = await dbUpdateItineraryItem(id, data)
    set((state) => ({
      itinerary: state.itinerary.map((i) => (i.id === id ? updated : i)),
    }))
    return updated
  },

  deleteItineraryItem: async (id) => {
    await dbDeleteItineraryItem(id)
    set((state) => ({ itinerary: state.itinerary.filter((i) => i.id !== id) }))
  },

  // ─── Checklist ──────────────────────────────────────────────────────────────

  addChecklistItem: async (data) => {
    const item = await createChecklistItem(data)
    set((state) => ({ checklist: [...state.checklist, item] }))
    return item
  },

  updateChecklistItem: async (id, data) => {
    const updated = await dbUpdateChecklistItem(id, data)
    set((state) => ({
      checklist: state.checklist.map((c) => (c.id === id ? updated : c)),
    }))
    return updated
  },

  deleteChecklistItem: async (id) => {
    await dbDeleteChecklistItem(id)
    set((state) => ({ checklist: state.checklist.filter((c) => c.id !== id) }))
  },

  // ─── Reflection ─────────────────────────────────────────────────────────────

  upsertReflection: async (data) => {
    const reflection = await dbUpsertReflection(data)
    set((state) => {
      const exists = state.reflections.some((r) => r.id === reflection.id)
      return {
        reflections: exists
          ? state.reflections.map((r) => (r.id === reflection.id ? reflection : r))
          : [...state.reflections, reflection],
      }
    })
    return reflection
  },

  // ─── Bulk Operations ────────────────────────────────────────────────────────

  seedDemo: async () => {
    set({ loading: true, error: null })
    try {
      await seedDemoData()
      await get().loadAll()
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  exportData: async () => {
    return exportAllData()
  },

  previewImportData: async (json) => {
    return getBackupImportPreview(json)
  },

  importData: async (json) => {
    set({ loading: true, error: null })
    try {
      await importAllData(json)
      await get().loadAll()
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  importDataByEvents: async (json, eventIds) => {
    set({ loading: true, error: null })
    try {
      await importDataByEventIds(json, eventIds)
      await get().loadAll()
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  resetData: async () => {
    set({ loading: true, error: null })
    try {
      await resetAllData()
      set({
        events: [],
        tickets: [],
        travels: [],
        lodgings: [],
        expenses: [],
        itinerary: [],
        checklist: [],
        reflections: [],
        loading: false,
        error: null,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  // ─── Computed Selectors ─────────────────────────────────────────────────────

  getEventById: (id) => {
    return get().events.find((e) => e.id === id)
  },

  getTicketByEventId: (id) => {
    return get().tickets.find((t) => t.eventId === id)
  },

  getTravelByEventId: (id) => {
    return get().travels.find((t) => t.eventId === id)
  },

  getLodgingByEventId: (id) => {
    return get().lodgings.find((l) => l.eventId === id)
  },

  getExpensesByEventId: (id) => {
    return get().expenses.filter((e) => e.eventId === id)
  },

  getItineraryByEventId: (id) => {
    return get()
      .itinerary.filter((i) => i.eventId === id)
      .sort((a, b) => a.order - b.order)
  },

  getChecklistByEventId: (id) => {
    return get()
      .checklist.filter((c) => c.eventId === id)
      .sort((a, b) => a.order - b.order)
  },

  getReflectionByEventId: (id) => {
    return get().reflections.find((r) => r.eventId === id)
  },

  getEventWithRelations: (id) => {
    const store = get()
    const event = store.events.find((e) => e.id === id)
    if (!event) return null

    return {
      event,
      ticket: store.getTicketByEventId(id),
      travel: store.getTravelByEventId(id),
      lodging: store.getLodgingByEventId(id),
      expenses: store.getExpensesByEventId(id),
      itinerary: store.getItineraryByEventId(id),
      checklist: store.getChecklistByEventId(id),
      reflection: store.getReflectionByEventId(id),
    }
  },
}))

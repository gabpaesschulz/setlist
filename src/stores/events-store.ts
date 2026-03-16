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
  AutoBackupSnapshot,
  PurchaseSimulation,
  EventAuditLog,
} from '@/types'
import {
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
  upsertPurchaseSimulation as dbUpsertPurchaseSimulation,
  deletePurchaseSimulation as dbDeletePurchaseSimulation,
  seedDemoData,
  exportAllData,
  getBackupImportPreview,
  importAllData,
  importDataByEventIds,
  resetAllData,
  createAutoBackupSnapshot as dbCreateAutoBackupSnapshot,
  listAutoBackupSnapshots as dbListAutoBackupSnapshots,
  restoreAutoBackupSnapshot as dbRestoreAutoBackupSnapshot,
  pruneAutoBackupSnapshots as dbPruneAutoBackupSnapshots,
  createEventAuditLog as dbCreateEventAuditLog,
  type BackupImportPreviewItem,
  db,
} from '@/lib/db'
import { buildAuditLogPayload } from '@/lib/domain/audit-trail'

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
  purchaseSimulations: PurchaseSimulation[]
  auditLogs: EventAuditLog[]
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
  upsertPurchaseSimulation: (
    data: Omit<PurchaseSimulation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => Promise<PurchaseSimulation>
  deletePurchaseSimulation: (id: string) => Promise<void>

  seedDemo: () => Promise<void>
  exportData: () => Promise<string>
  previewImportData: (json: string) => Promise<BackupImportPreviewItem[]>
  importData: (json: string) => Promise<void>
  importDataByEvents: (json: string, eventIds: string[]) => Promise<void>
  resetData: () => Promise<void>
  createAutoBackupSnapshot: () => Promise<AutoBackupSnapshot>
  listAutoBackupSnapshots: () => Promise<AutoBackupSnapshot[]>
  restoreAutoBackupSnapshot: (id: string) => Promise<void>
  pruneAutoBackupSnapshots: (retention: number) => Promise<void>

  // ─── Computed Selectors ───────────────────────────────────────────────
  getEventById: (id: string) => Event | undefined
  getTicketByEventId: (id: string) => Ticket | undefined
  getTravelByEventId: (id: string) => Travel | undefined
  getLodgingByEventId: (id: string) => Lodging | undefined
  getExpensesByEventId: (id: string) => Expense[]
  getItineraryByEventId: (id: string) => ItineraryItem[]
  getChecklistByEventId: (id: string) => ChecklistItem[]
  getReflectionByEventId: (id: string) => EventReflection | undefined
  getPurchaseSimulationsByEventId: (id: string) => PurchaseSimulation[]
  getAuditLogsByEventId: (id: string) => EventAuditLog[]
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
  purchaseSimulations: [],
  auditLogs: [],
  loading: false,
  error: null,

  // ─── Load All ───────────────────────────────────────────────────────────────

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [events, tickets, travels, lodgings, expenses, itinerary, checklist, reflections, purchaseSimulations, auditLogs] =
        await Promise.all([
          db.events.orderBy('date').toArray(),
          db.tickets.toArray(),
          db.travels.toArray(),
          db.lodgings.toArray(),
          db.expenses.toArray(),
          db.itinerary.toArray(),
          db.checklist.toArray(),
          db.reflections.toArray(),
          db.purchaseSimulations.toArray(),
          db.auditLogs.toArray(),
        ])
      set({ events, tickets, travels, lodgings, expenses, itinerary, checklist, reflections, purchaseSimulations, auditLogs, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  // ─── Events ─────────────────────────────────────────────────────────────────

  addEvent: async (data) => {
    const event = await createEvent(data)
    set((state) => ({ events: [...state.events, event].sort((a, b) => a.date.localeCompare(b.date)) }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: event.id,
        entityType: 'event',
        action: 'create',
        source: 'manual',
        after: event,
        summary: 'Evento criado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return event
  },

  updateEvent: async (id, data) => {
    const previous = get().events.find((event) => event.id === id)
    const updated = await dbUpdateEvent(id, data)
    set((state) => ({
      events: state.events
        .map((e) => (e.id === id ? updated : e))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: id,
        entityType: 'event',
        action: 'update',
        source: 'manual',
        before: previous,
        after: updated,
        summary: 'Evento atualizado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
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
      purchaseSimulations: state.purchaseSimulations.filter((p) => p.eventId !== id),
      auditLogs: state.auditLogs.filter((log) => log.eventId !== id),
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
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: newEvent.id,
        entityType: 'event',
        action: 'duplicate',
        source: 'manual',
        after: newEvent,
        summary: 'Evento duplicado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))

    return newEvent
  },

  completeEvent: async (id) => {
    const previous = get().events.find((event) => event.id === id)
    const updated = await dbUpdateEvent(id, {
      status: 'concluido',
      completedAt: new Date().toISOString(),
    })
    set((state) => ({
      events: state.events
        .map((e) => (e.id === id ? updated : e))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: id,
        entityType: 'event',
        action: 'complete',
        source: 'manual',
        before: previous,
        after: updated,
        summary: 'Evento marcado como concluído',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return updated
  },

  // ─── Ticket ─────────────────────────────────────────────────────────────────

  upsertTicket: async (data) => {
    const previous = get().tickets.find((ticket) => ticket.eventId === data.eventId)
    const ticket = await dbUpsertTicket(data)
    set((state) => {
      const exists = state.tickets.some((t) => t.id === ticket.id)
      return {
        tickets: exists
          ? state.tickets.map((t) => (t.id === ticket.id ? ticket : t))
          : [...state.tickets, ticket],
      }
    })
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: ticket.eventId,
        entityType: 'ticket',
        action: previous ? 'update' : 'create',
        source: 'manual',
        before: previous,
        after: ticket,
        summary: previous ? 'Ingresso atualizado' : 'Ingresso adicionado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return ticket
  },

  // ─── Travel ─────────────────────────────────────────────────────────────────

  upsertTravel: async (data) => {
    const previous = get().travels.find((travel) => travel.eventId === data.eventId)
    const travel = await dbUpsertTravel(data)
    set((state) => {
      const exists = state.travels.some((t) => t.id === travel.id)
      return {
        travels: exists
          ? state.travels.map((t) => (t.id === travel.id ? travel : t))
          : [...state.travels, travel],
      }
    })
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: travel.eventId,
        entityType: 'travel',
        action: previous ? 'update' : 'create',
        source: 'manual',
        before: previous,
        after: travel,
        summary: previous ? 'Viagem atualizada' : 'Viagem adicionada',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return travel
  },

  // ─── Lodging ────────────────────────────────────────────────────────────────

  upsertLodging: async (data) => {
    const previous = get().lodgings.find((lodging) => lodging.eventId === data.eventId)
    const lodging = await dbUpsertLodging(data)
    set((state) => {
      const exists = state.lodgings.some((l) => l.id === lodging.id)
      return {
        lodgings: exists
          ? state.lodgings.map((l) => (l.id === lodging.id ? lodging : l))
          : [...state.lodgings, lodging],
      }
    })
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: lodging.eventId,
        entityType: 'lodging',
        action: previous ? 'update' : 'create',
        source: 'manual',
        before: previous,
        after: lodging,
        summary: previous ? 'Hospedagem atualizada' : 'Hospedagem adicionada',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return lodging
  },

  // ─── Expenses ───────────────────────────────────────────────────────────────

  addExpense: async (data) => {
    const expense = await createExpense(data)
    set((state) => ({ expenses: [...state.expenses, expense] }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: expense.eventId,
        entityType: 'expense',
        action: 'create',
        source: 'manual',
        after: expense,
        summary: 'Gasto adicionado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return expense
  },

  updateExpense: async (id, data) => {
    const previous = get().expenses.find((expense) => expense.id === id)
    const updated = await dbUpdateExpense(id, data)
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
    }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: updated.eventId,
        entityType: 'expense',
        action: 'update',
        source: 'manual',
        before: previous,
        after: updated,
        summary: 'Gasto atualizado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return updated
  },

  deleteExpense: async (id) => {
    const previous = get().expenses.find((expense) => expense.id === id)
    await dbDeleteExpense(id)
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }))
    if (previous) {
      const auditLog = await dbCreateEventAuditLog(
        buildAuditLogPayload({
          eventId: previous.eventId,
          entityType: 'expense',
          action: 'delete',
          source: 'manual',
          before: previous,
          summary: 'Gasto removido',
        }),
      )
      set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    }
  },

  // ─── Itinerary ──────────────────────────────────────────────────────────────

  addItineraryItem: async (data) => {
    const item = await createItineraryItem(data)
    set((state) => ({ itinerary: [...state.itinerary, item] }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: item.eventId,
        entityType: 'itinerary',
        action: 'create',
        source: 'manual',
        after: item,
        summary: 'Item de roteiro adicionado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return item
  },

  updateItineraryItem: async (id, data) => {
    const previous = get().itinerary.find((item) => item.id === id)
    const updated = await dbUpdateItineraryItem(id, data)
    set((state) => ({
      itinerary: state.itinerary.map((i) => (i.id === id ? updated : i)),
    }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: updated.eventId,
        entityType: 'itinerary',
        action: 'update',
        source: 'manual',
        before: previous,
        after: updated,
        summary: 'Item de roteiro atualizado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return updated
  },

  deleteItineraryItem: async (id) => {
    const previous = get().itinerary.find((item) => item.id === id)
    await dbDeleteItineraryItem(id)
    set((state) => ({ itinerary: state.itinerary.filter((i) => i.id !== id) }))
    if (previous) {
      const auditLog = await dbCreateEventAuditLog(
        buildAuditLogPayload({
          eventId: previous.eventId,
          entityType: 'itinerary',
          action: 'delete',
          source: 'manual',
          before: previous,
          summary: 'Item de roteiro removido',
        }),
      )
      set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    }
  },

  // ─── Checklist ──────────────────────────────────────────────────────────────

  addChecklistItem: async (data) => {
    const item = await createChecklistItem(data)
    set((state) => ({ checklist: [...state.checklist, item] }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: item.eventId,
        entityType: 'checklist',
        action: 'create',
        source: 'manual',
        after: item,
        summary: 'Item de checklist adicionado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return item
  },

  updateChecklistItem: async (id, data) => {
    const previous = get().checklist.find((item) => item.id === id)
    const updated = await dbUpdateChecklistItem(id, data)
    set((state) => ({
      checklist: state.checklist.map((c) => (c.id === id ? updated : c)),
    }))
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: updated.eventId,
        entityType: 'checklist',
        action: 'update',
        source: 'manual',
        before: previous,
        after: updated,
        summary: 'Item de checklist atualizado',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return updated
  },

  deleteChecklistItem: async (id) => {
    const previous = get().checklist.find((item) => item.id === id)
    await dbDeleteChecklistItem(id)
    set((state) => ({ checklist: state.checklist.filter((c) => c.id !== id) }))
    if (previous) {
      const auditLog = await dbCreateEventAuditLog(
        buildAuditLogPayload({
          eventId: previous.eventId,
          entityType: 'checklist',
          action: 'delete',
          source: 'manual',
          before: previous,
          summary: 'Item de checklist removido',
        }),
      )
      set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    }
  },

  // ─── Reflection ─────────────────────────────────────────────────────────────

  upsertReflection: async (data) => {
    const previous = get().reflections.find((reflection) => reflection.eventId === data.eventId)
    const reflection = await dbUpsertReflection(data)
    set((state) => {
      const exists = state.reflections.some((r) => r.id === reflection.id)
      return {
        reflections: exists
          ? state.reflections.map((r) => (r.id === reflection.id ? reflection : r))
          : [...state.reflections, reflection],
      }
    })
    const auditLog = await dbCreateEventAuditLog(
      buildAuditLogPayload({
        eventId: reflection.eventId,
        entityType: 'reflection',
        action: previous ? 'update' : 'create',
        source: 'manual',
        before: previous,
        after: reflection,
        summary: previous ? 'Reflexão atualizada' : 'Reflexão adicionada',
      }),
    )
    set((state) => ({ auditLogs: [auditLog, ...state.auditLogs] }))
    return reflection
  },

  upsertPurchaseSimulation: async (data) => {
    const simulation = await dbUpsertPurchaseSimulation(data)
    set((state) => {
      const exists = state.purchaseSimulations.some((item) => item.id === simulation.id)
      return {
        purchaseSimulations: exists
          ? state.purchaseSimulations.map((item) => (item.id === simulation.id ? simulation : item))
          : [...state.purchaseSimulations, simulation].sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
      }
    })
    return simulation
  },

  deletePurchaseSimulation: async (id) => {
    await dbDeletePurchaseSimulation(id)
    set((state) => ({
      purchaseSimulations: state.purchaseSimulations.filter((item) => item.id !== id),
    }))
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
      const eventIds = get().events.map((event) => event.id)
      const logs = await Promise.all(
        eventIds.map((eventId) =>
          dbCreateEventAuditLog(
            buildAuditLogPayload({
              eventId,
              entityType: 'system',
              action: 'import',
              source: 'importacao',
              summary: 'Dados restaurados por importação completa',
            }),
          ),
        ),
      )
      set((state) => ({ auditLogs: [...logs, ...state.auditLogs] }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  importDataByEvents: async (json, eventIds) => {
    set({ loading: true, error: null })
    try {
      await importDataByEventIds(json, eventIds)
      await get().loadAll()
      const logs = await Promise.all(
        eventIds.map((eventId) =>
          dbCreateEventAuditLog(
            buildAuditLogPayload({
              eventId,
              entityType: 'system',
              action: 'restore',
              source: 'restauracao',
              summary: 'Evento restaurado a partir de backup seletivo',
            }),
          ),
        ),
      )
      set((state) => ({ auditLogs: [...logs, ...state.auditLogs] }))
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
        purchaseSimulations: [],
        auditLogs: [],
        loading: false,
        error: null,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createAutoBackupSnapshot: async () => {
    const payload = await exportAllData()
    return dbCreateAutoBackupSnapshot(payload)
  },

  listAutoBackupSnapshots: async () => {
    return dbListAutoBackupSnapshots()
  },

  restoreAutoBackupSnapshot: async (id) => {
    set({ loading: true, error: null })
    try {
      await dbRestoreAutoBackupSnapshot(id)
      await get().loadAll()
      const eventIds = get().events.map((event) => event.id)
      const logs = await Promise.all(
        eventIds.map((eventId) =>
          dbCreateEventAuditLog(
            buildAuditLogPayload({
              eventId,
              entityType: 'system',
              action: 'restore',
              source: 'snapshot',
              summary: 'Evento restaurado a partir de snapshot automático',
            }),
          ),
        ),
      )
      set((state) => ({ auditLogs: [...logs, ...state.auditLogs] }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  pruneAutoBackupSnapshots: async (retention) => {
    await dbPruneAutoBackupSnapshots(retention)
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

  getPurchaseSimulationsByEventId: (id) => {
    return get()
      .purchaseSimulations.filter((item) => item.eventId === id)
      .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
  },

  getAuditLogsByEventId: (id) => {
    return get()
      .auditLogs.filter((log) => log.eventId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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

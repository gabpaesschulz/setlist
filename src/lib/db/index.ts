import Dexie, { type Table } from 'dexie'
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
} from '@/types'
import { getDemoData } from '@/lib/demo/data'
import {
  filterBackupByEventIds,
  getBackupImportPreview,
  parseBackupData,
  type BackupImportPreviewItem,
} from '@/lib/domain/backup-import'
export { getBackupImportPreview }
export type { BackupImportPreviewItem }

// ─── Database class ───────────────────────────────────────────────────────────

class SetlistDB extends Dexie {
  events!: Table<Event>
  tickets!: Table<Ticket>
  travels!: Table<Travel>
  lodgings!: Table<Lodging>
  expenses!: Table<Expense>
  itinerary!: Table<ItineraryItem>
  checklist!: Table<ChecklistItem>
  reflections!: Table<EventReflection>
  backups!: Table<AutoBackupSnapshot>

  constructor() {
    super('SetlistDB')
    this.version(1).stores({
      events: 'id, date, status, type, city',
      tickets: 'id, eventId',
      travels: 'id, eventId',
      lodgings: 'id, eventId',
      expenses: 'id, eventId, category, expenseDate',
      itinerary: 'id, eventId, order',
      checklist: 'id, eventId, order',
      reflections: 'id, eventId',
    })
    this.version(2).stores({
      events: 'id, date, status, type, city',
      tickets: 'id, eventId',
      travels: 'id, eventId',
      lodgings: 'id, eventId',
      expenses: 'id, eventId, category, expenseDate',
      itinerary: 'id, eventId, order',
      checklist: 'id, eventId, order',
      reflections: 'id, eventId',
      backups: 'id, createdAt',
    })
  }
}

export const db = new SetlistDB()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// ─── Events CRUD ─────────────────────────────────────────────────────────────

export async function getAllEvents(): Promise<Event[]> {
  return db.events.orderBy('date').toArray()
}

export async function getEventById(id: string): Promise<Event | undefined> {
  return db.events.get(id)
}

export async function createEvent(
  data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Event> {
  const event: Event = {
    ...data,
    id: uuid(),
    createdAt: now(),
    updatedAt: now(),
  }
  await db.events.add(event)
  return event
}

export async function updateEvent(
  id: string,
  data: Partial<Event>,
): Promise<Event> {
  const existing = await db.events.get(id)
  if (!existing) throw new Error(`Event not found: ${id}`)
  const updated: Event = { ...existing, ...data, id, updatedAt: now() }
  await db.events.put(updated)
  return updated
}

export async function deleteEvent(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.events,
      db.tickets,
      db.travels,
      db.lodgings,
      db.expenses,
      db.itinerary,
      db.checklist,
      db.reflections,
    ],
    async () => {
      await db.events.delete(id)
      await db.tickets.where('eventId').equals(id).delete()
      await db.travels.where('eventId').equals(id).delete()
      await db.lodgings.where('eventId').equals(id).delete()
      await db.expenses.where('eventId').equals(id).delete()
      await db.itinerary.where('eventId').equals(id).delete()
      await db.checklist.where('eventId').equals(id).delete()
      await db.reflections.where('eventId').equals(id).delete()
    },
  )
}

export async function getEventWithRelations(
  id: string,
): Promise<EventWithRelations | null> {
  const event = await db.events.get(id)
  if (!event) return null

  const [ticket, travel, lodging, expenses, itinerary, checklist, reflection] =
    await Promise.all([
      db.tickets.where('eventId').equals(id).first(),
      db.travels.where('eventId').equals(id).first(),
      db.lodgings.where('eventId').equals(id).first(),
      db.expenses.where('eventId').equals(id).toArray(),
      db.itinerary.where('eventId').equals(id).sortBy('order'),
      db.checklist.where('eventId').equals(id).sortBy('order'),
      db.reflections.where('eventId').equals(id).first(),
    ])

  return {
    event,
    ticket,
    travel,
    lodging,
    expenses,
    itinerary,
    checklist,
    reflection,
  }
}

// ─── Tickets CRUD ─────────────────────────────────────────────────────────────

export async function getTicketByEventId(
  eventId: string,
): Promise<Ticket | undefined> {
  return db.tickets.where('eventId').equals(eventId).first()
}

export async function upsertTicket(
  data: Omit<Ticket, 'id'> & { id?: string },
): Promise<Ticket> {
  const id = data.id ?? uuid()
  const ticket: Ticket = { ...data, id }
  await db.tickets.put(ticket)
  return ticket
}

export async function deleteTicket(id: string): Promise<void> {
  await db.tickets.delete(id)
}

// ─── Travel CRUD ─────────────────────────────────────────────────────────────

export async function getTravelByEventId(
  eventId: string,
): Promise<Travel | undefined> {
  return db.travels.where('eventId').equals(eventId).first()
}

export async function upsertTravel(
  data: Omit<Travel, 'id'> & { id?: string },
): Promise<Travel> {
  const id = data.id ?? uuid()
  const travel: Travel = { ...data, id }
  await db.travels.put(travel)
  return travel
}

export async function deleteTravel(id: string): Promise<void> {
  await db.travels.delete(id)
}

// ─── Lodging CRUD ─────────────────────────────────────────────────────────────

export async function getLodgingByEventId(
  eventId: string,
): Promise<Lodging | undefined> {
  return db.lodgings.where('eventId').equals(eventId).first()
}

export async function upsertLodging(
  data: Omit<Lodging, 'id'> & { id?: string },
): Promise<Lodging> {
  const id = data.id ?? uuid()
  const lodging: Lodging = { ...data, id }
  await db.lodgings.put(lodging)
  return lodging
}

export async function deleteLodging(id: string): Promise<void> {
  await db.lodgings.delete(id)
}

// ─── Expenses CRUD ────────────────────────────────────────────────────────────

export async function getExpensesByEventId(eventId: string): Promise<Expense[]> {
  return db.expenses.where('eventId').equals(eventId).toArray()
}

export async function getAllExpenses(): Promise<Expense[]> {
  return db.expenses.orderBy('expenseDate').toArray()
}

export async function createExpense(
  data: Omit<Expense, 'id' | 'createdAt'>,
): Promise<Expense> {
  const expense: Expense = {
    ...data,
    id: uuid(),
    createdAt: now(),
  }
  await db.expenses.add(expense)
  return expense
}

export async function updateExpense(
  id: string,
  data: Partial<Expense>,
): Promise<Expense> {
  const existing = await db.expenses.get(id)
  if (!existing) throw new Error(`Expense not found: ${id}`)
  const updated: Expense = { ...existing, ...data, id }
  await db.expenses.put(updated)
  return updated
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id)
}

// ─── Itinerary CRUD ───────────────────────────────────────────────────────────

export async function getItineraryByEventId(
  eventId: string,
): Promise<ItineraryItem[]> {
  return db.itinerary.where('eventId').equals(eventId).sortBy('order')
}

export async function createItineraryItem(
  data: Omit<ItineraryItem, 'id'>,
): Promise<ItineraryItem> {
  const item: ItineraryItem = { ...data, id: uuid() }
  await db.itinerary.add(item)
  return item
}

export async function updateItineraryItem(
  id: string,
  data: Partial<ItineraryItem>,
): Promise<ItineraryItem> {
  const existing = await db.itinerary.get(id)
  if (!existing) throw new Error(`ItineraryItem not found: ${id}`)
  const updated: ItineraryItem = { ...existing, ...data, id }
  await db.itinerary.put(updated)
  return updated
}

export async function deleteItineraryItem(id: string): Promise<void> {
  await db.itinerary.delete(id)
}

export async function reorderItinerary(
  eventId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction('rw', db.itinerary, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.itinerary
        .where('id')
        .equals(orderedIds[i])
        .modify({ order: i })
    }
  })
}

// ─── Checklist CRUD ───────────────────────────────────────────────────────────

export async function getChecklistByEventId(
  eventId: string,
): Promise<ChecklistItem[]> {
  return db.checklist.where('eventId').equals(eventId).sortBy('order')
}

export async function createChecklistItem(
  data: Omit<ChecklistItem, 'id'>,
): Promise<ChecklistItem> {
  const item: ChecklistItem = { ...data, id: uuid() }
  await db.checklist.add(item)
  return item
}

export async function updateChecklistItem(
  id: string,
  data: Partial<ChecklistItem>,
): Promise<ChecklistItem> {
  const existing = await db.checklist.get(id)
  if (!existing) throw new Error(`ChecklistItem not found: ${id}`)
  const updated: ChecklistItem = { ...existing, ...data, id }
  await db.checklist.put(updated)
  return updated
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await db.checklist.delete(id)
}

export async function bulkCreateChecklist(
  items: Omit<ChecklistItem, 'id'>[],
): Promise<void> {
  const records: ChecklistItem[] = items.map((item) => ({
    ...item,
    id: uuid(),
  }))
  await db.checklist.bulkAdd(records)
}

// ─── Reflection CRUD ─────────────────────────────────────────────────────────

export async function getReflectionByEventId(
  eventId: string,
): Promise<EventReflection | undefined> {
  return db.reflections.where('eventId').equals(eventId).first()
}

export async function upsertReflection(
  data: Omit<EventReflection, 'id'> & { id?: string },
): Promise<EventReflection> {
  const id = data.id ?? uuid()
  const reflection: EventReflection = { ...data, id }
  await db.reflections.put(reflection)
  return reflection
}

// ─── Export / Import / Reset / Seed ──────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  const [
    events,
    tickets,
    travels,
    lodgings,
    expenses,
    itinerary,
    checklist,
    reflections,
  ] = await Promise.all([
    db.events.toArray(),
    db.tickets.toArray(),
    db.travels.toArray(),
    db.lodgings.toArray(),
    db.expenses.toArray(),
    db.itinerary.toArray(),
    db.checklist.toArray(),
    db.reflections.toArray(),
  ])

  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      events,
      tickets,
      travels,
      lodgings,
      expenses,
      itinerary,
      checklist,
      reflections,
    },
    null,
    2,
  )
}

export async function listAutoBackupSnapshots(): Promise<AutoBackupSnapshot[]> {
  const snapshots = await db.backups.toArray()
  return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createAutoBackupSnapshot(payload: string): Promise<AutoBackupSnapshot> {
  const snapshot: AutoBackupSnapshot = {
    id: uuid(),
    createdAt: now(),
    payload,
  }
  await db.backups.add(snapshot)
  return snapshot
}

export async function deleteAutoBackupSnapshots(ids: string[]): Promise<void> {
  if (!ids.length) return
  await db.backups.bulkDelete(ids)
}

export async function pruneAutoBackupSnapshots(retention: number): Promise<void> {
  const normalizedRetention = Math.max(1, Math.round(retention))
  const snapshots = await listAutoBackupSnapshots()
  const toDelete = snapshots.slice(normalizedRetention).map((snapshot) => snapshot.id)
  await deleteAutoBackupSnapshots(toDelete)
}

export async function restoreAutoBackupSnapshot(id: string): Promise<void> {
  const snapshot = await db.backups.get(id)
  if (!snapshot) {
    throw new Error('Snapshot de backup não encontrado.')
  }
  await importAllData(snapshot.payload)
}

export async function importAllData(jsonStr: string): Promise<void> {
  const data = parseBackupData(jsonStr)

  await db.transaction(
    'rw',
    [
      db.events,
      db.tickets,
      db.travels,
      db.lodgings,
      db.expenses,
      db.itinerary,
      db.checklist,
      db.reflections,
    ],
    async () => {
      await Promise.all([
        db.events.clear(),
        db.tickets.clear(),
        db.travels.clear(),
        db.lodgings.clear(),
        db.expenses.clear(),
        db.itinerary.clear(),
        db.checklist.clear(),
        db.reflections.clear(),
      ])

      await Promise.all([
        data.events.length ? db.events.bulkAdd(data.events) : Promise.resolve(),
        data.tickets.length ? db.tickets.bulkAdd(data.tickets) : Promise.resolve(),
        data.travels.length ? db.travels.bulkAdd(data.travels) : Promise.resolve(),
        data.lodgings.length ? db.lodgings.bulkAdd(data.lodgings) : Promise.resolve(),
        data.expenses.length ? db.expenses.bulkAdd(data.expenses) : Promise.resolve(),
        data.itinerary.length ? db.itinerary.bulkAdd(data.itinerary) : Promise.resolve(),
        data.checklist.length ? db.checklist.bulkAdd(data.checklist) : Promise.resolve(),
        data.reflections.length ? db.reflections.bulkAdd(data.reflections) : Promise.resolve(),
      ])
    },
  )
}

export async function importDataByEventIds(
  jsonStr: string,
  eventIds: string[],
): Promise<void> {
  if (eventIds.length === 0) {
    throw new Error('Selecione ao menos um evento para restaurar.')
  }

  const fullData = parseBackupData(jsonStr)
  const selectedData = filterBackupByEventIds(fullData, eventIds)
  const selectedIds = selectedData.events.map((event) => event.id)

  if (selectedIds.length === 0) {
    throw new Error('Nenhum evento selecionado foi encontrado no backup.')
  }

  await db.transaction(
    'rw',
    [
      db.events,
      db.tickets,
      db.travels,
      db.lodgings,
      db.expenses,
      db.itinerary,
      db.checklist,
      db.reflections,
    ],
    async () => {
      await Promise.all([
        db.events.bulkDelete(selectedIds),
        db.tickets.where('eventId').anyOf(selectedIds).delete(),
        db.travels.where('eventId').anyOf(selectedIds).delete(),
        db.lodgings.where('eventId').anyOf(selectedIds).delete(),
        db.expenses.where('eventId').anyOf(selectedIds).delete(),
        db.itinerary.where('eventId').anyOf(selectedIds).delete(),
        db.checklist.where('eventId').anyOf(selectedIds).delete(),
        db.reflections.where('eventId').anyOf(selectedIds).delete(),
      ])

      await Promise.all([
        selectedData.events.length
          ? db.events.bulkPut(selectedData.events)
          : Promise.resolve(),
        selectedData.tickets.length
          ? db.tickets.bulkPut(selectedData.tickets)
          : Promise.resolve(),
        selectedData.travels.length
          ? db.travels.bulkPut(selectedData.travels)
          : Promise.resolve(),
        selectedData.lodgings.length
          ? db.lodgings.bulkPut(selectedData.lodgings)
          : Promise.resolve(),
        selectedData.expenses.length
          ? db.expenses.bulkPut(selectedData.expenses)
          : Promise.resolve(),
        selectedData.itinerary.length
          ? db.itinerary.bulkPut(selectedData.itinerary)
          : Promise.resolve(),
        selectedData.checklist.length
          ? db.checklist.bulkPut(selectedData.checklist)
          : Promise.resolve(),
        selectedData.reflections.length
          ? db.reflections.bulkPut(selectedData.reflections)
          : Promise.resolve(),
      ])
    },
  )
}

export async function resetAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.events,
      db.tickets,
      db.travels,
      db.lodgings,
      db.expenses,
      db.itinerary,
      db.checklist,
      db.reflections,
    ],
    async () => {
      await Promise.all([
        db.events.clear(),
        db.tickets.clear(),
        db.travels.clear(),
        db.lodgings.clear(),
        db.expenses.clear(),
        db.itinerary.clear(),
        db.checklist.clear(),
        db.reflections.clear(),
      ])
    },
  )
}

export async function seedDemoData(): Promise<void> {
  const {
    events,
    tickets,
    travels,
    lodgings,
    expenses,
    itinerary,
    checklist,
    reflections,
  } = getDemoData()

  await db.transaction(
    'rw',
    [
      db.events,
      db.tickets,
      db.travels,
      db.lodgings,
      db.expenses,
      db.itinerary,
      db.checklist,
      db.reflections,
    ],
    async () => {
      await Promise.all([
        db.events.bulkAdd(events),
        db.tickets.bulkAdd(tickets),
        db.travels.bulkAdd(travels),
        db.lodgings.bulkAdd(lodgings),
        db.expenses.bulkAdd(expenses),
        db.itinerary.bulkAdd(itinerary),
        db.checklist.bulkAdd(checklist),
        reflections.length ? db.reflections.bulkAdd(reflections) : Promise.resolve(),
      ])
    },
  )
}

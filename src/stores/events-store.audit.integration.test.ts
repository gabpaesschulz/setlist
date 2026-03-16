import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Expense, EventAuditLog } from '@/types'

const mocks = vi.hoisted(() => ({
  createExpense: vi.fn(),
  createEventAuditLog: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getAllEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  upsertTicket: vi.fn(),
  upsertTravel: vi.fn(),
  upsertLodging: vi.fn(),
  createExpense: mocks.createExpense,
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  createItineraryItem: vi.fn(),
  updateItineraryItem: vi.fn(),
  deleteItineraryItem: vi.fn(),
  createChecklistItem: vi.fn(),
  updateChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
  upsertReflection: vi.fn(),
  upsertPurchaseSimulation: vi.fn(),
  deletePurchaseSimulation: vi.fn(),
  seedDemoData: vi.fn(),
  exportAllData: vi.fn(),
  getBackupImportPreview: vi.fn(),
  importAllData: vi.fn(),
  importDataByEventIds: vi.fn(),
  resetAllData: vi.fn(),
  createAutoBackupSnapshot: vi.fn(),
  listAutoBackupSnapshots: vi.fn(),
  restoreAutoBackupSnapshot: vi.fn(),
  pruneAutoBackupSnapshots: vi.fn(),
  createEventAuditLog: mocks.createEventAuditLog,
  db: {
    events: { orderBy: vi.fn(() => ({ toArray: vi.fn(async () => []) })) },
    tickets: { toArray: vi.fn(async () => []) },
    travels: { toArray: vi.fn(async () => []) },
    lodgings: { toArray: vi.fn(async () => []) },
    expenses: { toArray: vi.fn(async () => []) },
    itinerary: { toArray: vi.fn(async () => []) },
    checklist: { toArray: vi.fn(async () => []) },
    reflections: { toArray: vi.fn(async () => []) },
    purchaseSimulations: { toArray: vi.fn(async () => []) },
    auditLogs: { toArray: vi.fn(async () => []) },
  },
}))

import { useEventsStore } from '@/stores/events-store'

describe('useEventsStore audit integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEventsStore.setState({
      expenses: [],
      auditLogs: [],
    })
  })

  it('registra log de auditoria ao adicionar gasto', async () => {
    const expense: Expense = {
      id: 'expense-1',
      eventId: 'event-1',
      category: 'ingresso',
      amount: 120,
      description: 'Ingresso meia',
      expenseDate: '2026-05-02',
      createdAt: '2026-03-15T10:00:00.000Z',
    }
    const log: EventAuditLog = {
      id: 'log-1',
      eventId: 'event-1',
      entityType: 'expense',
      action: 'create',
      source: 'manual',
      summary: 'Gasto adicionado',
      changes: [],
      createdAt: '2026-03-15T10:00:01.000Z',
    }
    mocks.createExpense.mockResolvedValue(expense)
    mocks.createEventAuditLog.mockResolvedValue(log)

    await useEventsStore.getState().addExpense({
      eventId: 'event-1',
      category: 'ingresso',
      amount: 120,
      description: 'Ingresso meia',
      expenseDate: '2026-05-02',
    })

    expect(mocks.createExpense).toHaveBeenCalled()
    expect(mocks.createEventAuditLog).toHaveBeenCalled()
    expect(useEventsStore.getState().auditLogs[0]).toEqual(log)
  })
})

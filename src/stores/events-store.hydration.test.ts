import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  eventsToArray: vi.fn(),
  ticketsToArray: vi.fn(),
  travelsToArray: vi.fn(),
  lodgingsToArray: vi.fn(),
  expensesToArray: vi.fn(),
  itineraryToArray: vi.fn(),
  checklistToArray: vi.fn(),
  reflectionsToArray: vi.fn(),
  purchaseSimulationsToArray: vi.fn(),
  auditLogsToArray: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  upsertTicket: vi.fn(),
  upsertTravel: vi.fn(),
  upsertLodging: vi.fn(),
  createExpense: vi.fn(),
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
  createEventAuditLog: vi.fn(),
  db: {
    events: {
      orderBy: vi.fn(() => ({
        toArray: mocks.eventsToArray,
      })),
    },
    tickets: { toArray: mocks.ticketsToArray },
    travels: { toArray: mocks.travelsToArray },
    lodgings: { toArray: mocks.lodgingsToArray },
    expenses: { toArray: mocks.expensesToArray },
    itinerary: { toArray: mocks.itineraryToArray },
    checklist: { toArray: mocks.checklistToArray },
    reflections: { toArray: mocks.reflectionsToArray },
    purchaseSimulations: { toArray: mocks.purchaseSimulationsToArray },
    auditLogs: { toArray: mocks.auditLogsToArray },
  },
}))

import { useEventsStore } from '@/stores/events-store'

describe('useEventsStore hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.eventsToArray.mockResolvedValue([])
    mocks.ticketsToArray.mockResolvedValue([])
    mocks.travelsToArray.mockResolvedValue([])
    mocks.lodgingsToArray.mockResolvedValue([])
    mocks.expensesToArray.mockResolvedValue([])
    mocks.itineraryToArray.mockResolvedValue([])
    mocks.checklistToArray.mockResolvedValue([])
    mocks.reflectionsToArray.mockResolvedValue([])
    mocks.purchaseSimulationsToArray.mockResolvedValue([])
    mocks.auditLogsToArray.mockResolvedValue([])
    useEventsStore.setState({
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
      isHydrated: false,
      error: null,
    })
  })

  it('deduplica chamadas concorrentes de loadAll', async () => {
    let release: (() => void) | null = null
    const pending = new Promise<never[]>((resolve) => {
      release = () => resolve([])
    })
    mocks.eventsToArray.mockReturnValue(pending)

    const p1 = useEventsStore.getState().loadAll()
    const p2 = useEventsStore.getState().loadAll()

    expect(mocks.eventsToArray).toHaveBeenCalledTimes(1)

    release?.()
    await Promise.all([p1, p2])

    expect(useEventsStore.getState().isHydrated).toBe(true)
    expect(useEventsStore.getState().loading).toBe(false)
  })

  it('hidrata apenas uma vez com ensureHydrated quando já carregado', async () => {
    await useEventsStore.getState().ensureHydrated()
    await useEventsStore.getState().ensureHydrated()

    expect(mocks.eventsToArray).toHaveBeenCalledTimes(1)
    expect(useEventsStore.getState().isHydrated).toBe(true)
  })

  it('força refresh explícito com refreshAll mesmo após hidratação', async () => {
    await useEventsStore.getState().ensureHydrated()
    await useEventsStore.getState().refreshAll()

    expect(mocks.eventsToArray).toHaveBeenCalledTimes(2)
  })
})

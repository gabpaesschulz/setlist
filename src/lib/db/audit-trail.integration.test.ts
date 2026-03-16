import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createEvent,
  createEventAuditLog,
  exportAllData,
  importAllData,
  getAuditLogsByEventId,
  db,
} from '@/lib/db'

describe('audit-trail db integration', () => {
  beforeEach(async () => {
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
        db.purchaseSimulations,
        db.auditLogs,
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
          db.purchaseSimulations.clear(),
          db.auditLogs.clear(),
        ])
      },
    )
  })

  afterEach(async () => {
    await db.auditLogs.clear()
    await db.events.clear()
  })

  it('persiste e consulta histórico por evento em ordem decrescente', async () => {
    const event = await createEvent({
      title: 'Show Teste',
      artist: 'Banda',
      type: 'show',
      status: 'ativo',
      date: '2026-08-10',
      city: 'São Paulo',
      state: 'SP',
      venue: 'Arena',
    })

    await createEventAuditLog({
      eventId: event.id,
      entityType: 'event',
      action: 'create',
      source: 'manual',
      summary: 'Evento criado',
      changes: [],
    })
    await createEventAuditLog({
      eventId: event.id,
      entityType: 'expense',
      action: 'create',
      source: 'manual',
      summary: 'Gasto adicionado',
      changes: [{ field: 'amount', after: '120' }],
    })

    const logs = await getAuditLogsByEventId(event.id)

    expect(logs).toHaveLength(2)
    expect(logs.map((log) => log.summary)).toEqual(
      expect.arrayContaining(['Evento criado', 'Gasto adicionado']),
    )
  })

  it('exporta e importa auditLogs preservando referências do evento', async () => {
    const event = await createEvent({
      title: 'Festival',
      artist: 'Artista',
      type: 'festival',
      status: 'ativo',
      date: '2026-09-20',
      city: 'Curitiba',
      state: 'PR',
      venue: 'Parque',
    })

    await createEventAuditLog({
      eventId: event.id,
      entityType: 'event',
      action: 'update',
      source: 'manual',
      summary: 'Evento atualizado',
      changes: [{ field: 'venue', before: 'Parque A', after: 'Parque' }],
    })

    const backup = await exportAllData()
    await importAllData(backup)

    const logs = await getAuditLogsByEventId(event.id)
    expect(logs).toHaveLength(1)
    expect(logs[0].changes[0].field).toBe('venue')
  })
})

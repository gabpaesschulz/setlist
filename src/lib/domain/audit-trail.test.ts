import { describe, expect, it } from 'vitest'
import { buildAuditFieldChanges, buildAuditLogPayload } from '@/lib/domain/audit-trail'

describe('audit-trail', () => {
  it('gera diff apenas de campos alterados', () => {
    const changes = buildAuditFieldChanges(
      { title: 'Show A', city: 'SP', status: 'ativo' },
      { title: 'Show A', city: 'RJ', status: 'concluido' },
    )

    expect(changes).toEqual([
      { field: 'city', before: 'SP', after: 'RJ' },
      { field: 'status', before: 'ativo', after: 'concluido' },
    ])
  })

  it('serializa valores complexos e trata undefined', () => {
    const changes = buildAuditFieldChanges(
      { budgetByCategory: { ingresso: 100 }, note: undefined },
      { budgetByCategory: { ingresso: 120 }, note: 'ajustado' },
    )

    expect(changes).toEqual([
      {
        field: 'budgetByCategory',
        before: '{"ingresso":100}',
        after: '{"ingresso":120}',
      },
      {
        field: 'note',
        before: undefined,
        after: 'ajustado',
      },
    ])
  })

  it('constrói payload com resumo automático', () => {
    const payload = buildAuditLogPayload({
      eventId: 'event-1',
      entityType: 'expense',
      action: 'update',
      source: 'manual',
      before: { amount: 50 },
      after: { amount: 90 },
    })

    expect(payload.eventId).toBe('event-1')
    expect(payload.summary).toContain('expense update')
    expect(payload.changes).toHaveLength(1)
  })

  it('preserva resumo customizado', () => {
    const payload = buildAuditLogPayload({
      eventId: 'event-1',
      entityType: 'event',
      action: 'complete',
      source: 'manual',
      summary: 'Evento marcado como concluído',
    })

    expect(payload.summary).toBe('Evento marcado como concluído')
    expect(payload.changes).toEqual([])
  })
})

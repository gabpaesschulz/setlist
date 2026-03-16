import { describe, expect, it } from 'vitest'
import {
  filterBackupByEventIds,
  getBackupImportPreview,
  parseBackupData,
} from '@/lib/domain/backup-import'

const eventA = {
  id: 'event-a',
  title: 'Show A',
  artist: 'Banda A',
  type: 'show',
  status: 'ativo',
  date: '2026-10-10',
  city: 'São Paulo',
  state: 'SP',
  venue: 'Allianz',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const eventB = {
  ...eventA,
  id: 'event-b',
  title: 'Show B',
  artist: 'Banda B',
  date: '2026-09-10',
}

const validBackup = {
  version: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
  events: [eventA, eventB],
  tickets: [
    {
      id: 'ticket-1',
      eventId: 'event-a',
      sector: 'Pista',
      ticketType: 'Inteira',
      purchaseType: 'inteira',
      provider: 'Sympla',
      price: 100,
      fee: 10,
      purchased: true,
    },
  ],
  travels: [],
  lodgings: [],
  expenses: [],
  itinerary: [],
  checklist: [],
  reflections: [],
}

describe('backup-import domain', () => {
  it('valida e normaliza backup válido', () => {
    const parsed = parseBackupData(JSON.stringify(validBackup))
    expect(parsed.version).toBe(1)
    expect(parsed.events).toHaveLength(2)
    expect(parsed.travels).toEqual([])
  })

  it('falha em JSON inválido', () => {
    expect(() => parseBackupData('{')).toThrow('Arquivo JSON inválido.')
  })

  it('falha em backup com versão incompatível', () => {
    expect(() =>
      parseBackupData(JSON.stringify({ ...validBackup, version: 2 })),
    ).toThrow('Backup inválido ou incompatível com esta versão do app.')
  })

  it('falha em referências inválidas entre entidades', () => {
    expect(() =>
      parseBackupData(
        JSON.stringify({
          ...validBackup,
          tickets: [{ ...validBackup.tickets[0], eventId: 'inexistente' }],
        }),
      ),
    ).toThrow('Backup com referências inválidas entre registros.')
  })

  it('gera prévia de eventos ordenada por data', () => {
    const preview = getBackupImportPreview(JSON.stringify(validBackup))
    expect(preview.map((item) => item.id)).toEqual(['event-b', 'event-a'])
  })

  it('filtra backup para eventos selecionados', () => {
    const parsed = parseBackupData(JSON.stringify(validBackup))
    const filtered = filterBackupByEventIds(parsed, ['event-b'])
    expect(filtered.events.map((event) => event.id)).toEqual(['event-b'])
    expect(filtered.tickets).toEqual([])
  })
})

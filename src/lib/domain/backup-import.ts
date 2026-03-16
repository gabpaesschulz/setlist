import { backupDataSchema, type BackupDataSchema } from '@/schemas'

type BackupCollectionKey =
  | 'tickets'
  | 'travels'
  | 'lodgings'
  | 'expenses'
  | 'itinerary'
  | 'checklist'
  | 'reflections'

const backupCollectionKeys: BackupCollectionKey[] = [
  'tickets',
  'travels',
  'lodgings',
  'expenses',
  'itinerary',
  'checklist',
  'reflections',
]

export interface BackupImportPreviewItem {
  id: string
  title: string
  artist: string
  date: string
  city: string
  venue: string
}

export function parseBackupData(jsonStr: string): BackupDataSchema {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Arquivo JSON inválido.')
  }

  const validated = backupDataSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error('Backup inválido ou incompatível com esta versão do app.')
  }

  const eventIds = new Set(validated.data.events.map((event) => event.id))
  for (const key of backupCollectionKeys) {
    const invalidRecord = validated.data[key].find(
      (record) => !eventIds.has(record.eventId),
    )
    if (invalidRecord) {
      throw new Error('Backup com referências inválidas entre registros.')
    }
  }

  return validated.data
}

export function getBackupImportPreview(jsonStr: string): BackupImportPreviewItem[] {
  const data = parseBackupData(jsonStr)
  return [...data.events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((event) => ({
      id: event.id,
      title: event.title,
      artist: event.artist,
      date: event.date,
      city: event.city,
      venue: event.venue,
    }))
}

export function filterBackupByEventIds(
  data: BackupDataSchema,
  eventIds: string[],
): BackupDataSchema {
  const selectedIds = new Set(eventIds)
  return {
    ...data,
    events: data.events.filter((event) => selectedIds.has(event.id)),
    tickets: data.tickets.filter((record) => selectedIds.has(record.eventId)),
    travels: data.travels.filter((record) => selectedIds.has(record.eventId)),
    lodgings: data.lodgings.filter((record) => selectedIds.has(record.eventId)),
    expenses: data.expenses.filter((record) => selectedIds.has(record.eventId)),
    itinerary: data.itinerary.filter((record) => selectedIds.has(record.eventId)),
    checklist: data.checklist.filter((record) => selectedIds.has(record.eventId)),
    reflections: data.reflections.filter((record) => selectedIds.has(record.eventId)),
  }
}

import type { Event, EventType } from '@/types'

const EVENT_TYPES: EventType[] = ['show', 'festival', 'convencao', 'outro']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

export interface SharedEventPayload {
  version: 1
  sharedAt: string
  event: {
    title: string
    artist: string
    type: EventType
    date: string
    endDate?: string
    time?: string
    city: string
    state: string
    venue: string
    notes?: string
  }
}

export function createSharePayload(event: Event): string {
  const payload: SharedEventPayload = {
    version: 1,
    sharedAt: new Date().toISOString(),
    event: {
      title: event.title.trim(),
      artist: event.artist.trim() || event.title.trim(),
      type: event.type,
      date: event.date,
      endDate: event.endDate,
      time: event.time,
      city: event.city.trim(),
      state: event.state.trim().toUpperCase(),
      venue: event.venue.trim(),
      notes: event.notes?.trim() || undefined,
    },
  }

  return JSON.stringify(payload)
}

export function parseSharePayload(raw: string): SharedEventPayload {
  if (!raw || raw.length > 6000) {
    throw new Error('Link inválido ou muito grande.')
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Não foi possível ler os dados do link.')
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Formato de compartilhamento inválido.')
  }

  const obj = data as Record<string, unknown>
  if (obj.version !== 1) {
    throw new Error('Versão de compartilhamento não suportada.')
  }

  const event = obj.event as Record<string, unknown> | undefined
  if (!event || typeof event !== 'object') {
    throw new Error('Dados do evento não encontrados no link.')
  }

  const type = toText(event.type)
  if (!EVENT_TYPES.includes(type as EventType)) {
    throw new Error('Tipo de evento inválido no link.')
  }

  const date = toText(event.date)
  if (!DATE_PATTERN.test(date)) {
    throw new Error('Data do evento inválida no link.')
  }

  const endDate = toOptionalText(event.endDate)
  if (endDate && !DATE_PATTERN.test(endDate)) {
    throw new Error('Data final inválida no link.')
  }

  const time = toOptionalText(event.time)
  if (time && !TIME_PATTERN.test(time)) {
    throw new Error('Horário inválido no link.')
  }

  const title = toRequired(event.title, 'Título')
  const artist = toRequired(event.artist, 'Artista')
  const city = toRequired(event.city, 'Cidade')
  const venue = toRequired(event.venue, 'Local')
  const state = toRequired(event.state, 'Estado').toUpperCase()
  if (state.length !== 2) {
    throw new Error('Estado inválido no link.')
  }

  return {
    version: 1,
    sharedAt: toText(obj.sharedAt || new Date().toISOString()),
    event: {
      title,
      artist,
      type: type as EventType,
      date,
      endDate,
      time,
      city,
      state,
      venue,
      notes: toOptionalText(event.notes),
    },
  }
}

function toRequired(value: unknown, label: string): string {
  const text = toText(value).trim()
  if (!text) {
    throw new Error(`${label} ausente no link.`)
  }
  return text
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toOptionalText(value: unknown): string | undefined {
  const text = toText(value).trim()
  return text ? text : undefined
}

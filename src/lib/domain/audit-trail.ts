import type { AuditAction, AuditEntityType, AuditFieldChange, EventAuditLog } from '@/types'

export interface BuildAuditLogInput {
  eventId: string
  entityType: AuditEntityType
  action: AuditAction
  source: string
  before?: unknown
  after?: unknown
  summary?: string
}

function normalizeValue(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/**
 * Gera uma lista de alterações por campo comparando snapshots antes/depois.
 */
export function buildAuditFieldChanges(
  before?: unknown,
  after?: unknown,
): AuditFieldChange[] {
  const beforeRecord =
    before && typeof before === 'object'
      ? (before as Record<string, unknown>)
      : undefined
  const afterRecord =
    after && typeof after === 'object'
      ? (after as Record<string, unknown>)
      : undefined

  const keys = new Set<string>([
    ...Object.keys(beforeRecord ?? {}),
    ...Object.keys(afterRecord ?? {}),
  ])

  const changes: AuditFieldChange[] = []
  for (const field of keys) {
    const previous = normalizeValue(beforeRecord?.[field])
    const next = normalizeValue(afterRecord?.[field])
    if (previous === next) continue
    changes.push({
      field,
      before: previous,
      after: next,
    })
  }

  return changes
}

/**
 * Constrói payload de trilha de auditoria com resumo e diff resumido.
 */
export function buildAuditLogPayload(input: BuildAuditLogInput): Omit<EventAuditLog, 'id' | 'createdAt'> {
  const changes = buildAuditFieldChanges(input.before, input.after)
  const summary =
    input.summary ??
    `${input.entityType} ${input.action}${changes.length ? ` (${changes.length} alteração(ões))` : ''}`

  return {
    eventId: input.eventId,
    entityType: input.entityType,
    action: input.action,
    source: input.source,
    summary,
    changes,
  }
}

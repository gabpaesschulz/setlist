import type { AuditAction, AuditEntityType } from '@/types'

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criado',
  update: 'Atualizado',
  delete: 'Removido',
  complete: 'Concluído',
  duplicate: 'Duplicado',
  restore: 'Restaurado',
  import: 'Importado',
  reset: 'Resetado',
}

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  event: 'Evento',
  ticket: 'Ingresso',
  travel: 'Viagem',
  lodging: 'Hospedagem',
  expense: 'Gasto',
  itinerary: 'Roteiro',
  checklist: 'Checklist',
  reflection: 'Reflexão',
  system: 'Sistema',
}

/**
 * Retorna um rótulo amigável para a ação de auditoria.
 */
export function getAuditActionLabel(action: AuditAction): string {
  return ACTION_LABELS[action] ?? action
}

/**
 * Retorna um rótulo amigável para a entidade de auditoria.
 */
export function getAuditEntityLabel(entity: AuditEntityType): string {
  return ENTITY_LABELS[entity] ?? entity
}

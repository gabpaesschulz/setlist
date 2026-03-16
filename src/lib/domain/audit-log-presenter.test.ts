import { describe, expect, it } from 'vitest'
import { getAuditActionLabel, getAuditEntityLabel } from '@/lib/domain/audit-log-presenter'

describe('audit-log-presenter', () => {
  it('retorna rótulos amigáveis para ações conhecidas', () => {
    expect(getAuditActionLabel('create')).toBe('Criado')
    expect(getAuditActionLabel('restore')).toBe('Restaurado')
  })

  it('retorna rótulos amigáveis para entidades conhecidas', () => {
    expect(getAuditEntityLabel('event')).toBe('Evento')
    expect(getAuditEntityLabel('system')).toBe('Sistema')
  })

  it('mantém valor original para ação ou entidade não mapeada', () => {
    expect(getAuditActionLabel('custom' as never)).toBe('custom')
    expect(getAuditEntityLabel('custom' as never)).toBe('custom')
  })
})

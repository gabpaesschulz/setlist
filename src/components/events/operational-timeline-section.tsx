'use client'

import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAuditActionLabel, getAuditEntityLabel } from '@/lib/domain/audit-log-presenter'
import type { AuditAction, AuditEntityType, EventAuditLog } from '@/types'

interface OperationalTimelineSectionProps {
  auditLogs: EventAuditLog[]
}

const ACTION_FILTERS: Array<{ value: 'all' | AuditAction; label: string }> = [
  { value: 'all', label: 'Todas as ações' },
  { value: 'create', label: 'Criações' },
  { value: 'update', label: 'Atualizações' },
  { value: 'delete', label: 'Remoções' },
  { value: 'complete', label: 'Conclusões' },
  { value: 'restore', label: 'Restaurações' },
  { value: 'import', label: 'Importações' },
]

const ENTITY_FILTERS: Array<{ value: 'all' | AuditEntityType; label: string }> = [
  { value: 'all', label: 'Todas as entidades' },
  { value: 'event', label: 'Evento' },
  { value: 'ticket', label: 'Ingresso' },
  { value: 'travel', label: 'Viagem' },
  { value: 'lodging', label: 'Hospedagem' },
  { value: 'expense', label: 'Gasto' },
  { value: 'itinerary', label: 'Roteiro' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'reflection', label: 'Reflexão' },
  { value: 'system', label: 'Sistema' },
]

const PERIOD_FILTERS = [
  { value: 'all', label: 'Todo o período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
] as const

const PAGE_SIZE = 8

export function OperationalTimelineSection({ auditLogs }: OperationalTimelineSectionProps) {
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | AuditEntityType>('all')
  const [periodFilter, setPeriodFilter] = useState<(typeof PERIOD_FILTERS)[number]['value']>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const periodThreshold = useMemo(() => {
    if (periodFilter === 'all') return null
    const days = Number(periodFilter.replace('d', ''))
    const thresholdDate = new Date()
    thresholdDate.setHours(0, 0, 0, 0)
    thresholdDate.setDate(thresholdDate.getDate() - days)
    return thresholdDate.getTime()
  }, [periodFilter])

  const filteredLogs = useMemo(
    () =>
      auditLogs.filter(
        (log) =>
          (actionFilter === 'all' || log.action === actionFilter) &&
          (entityFilter === 'all' || log.entityType === entityFilter) &&
          (periodThreshold === null || new Date(log.createdAt).getTime() >= periodThreshold),
      ),
    [actionFilter, auditLogs, entityFilter, periodThreshold],
  )

  const visibleLogs = filteredLogs.slice(0, visibleCount)
  const hasMore = filteredLogs.length > visibleCount

  return (
    <div className="bg-card rounded-xl p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Histórico operacional</h3>
      </div>

      {auditLogs.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-3">
          <Select
            value={actionFilter}
            onValueChange={(value) => {
              setActionFilter(value as 'all' | AuditAction)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger aria-label="Filtrar por ação">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={entityFilter}
            onValueChange={(value) => {
              setEntityFilter(value as 'all' | AuditEntityType)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger aria-label="Filtrar por entidade">
              <SelectValue placeholder="Filtrar por entidade" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={periodFilter}
            onValueChange={(value) => {
              setPeriodFilter(value as (typeof PERIOD_FILTERS)[number]['value'])
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger aria-label="Filtrar por período">
              <SelectValue placeholder="Filtrar por período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {auditLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem alterações registradas até o momento.</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro encontrado para os filtros selecionados.</p>
      ) : (
        <div className="space-y-2">
          {visibleLogs.map((log) => (
            <div key={log.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium">{log.summary}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {getAuditEntityLabel(log.entityType)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {getAuditActionLabel(log.action)}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
              </p>
              {log.changes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {log.changes.slice(0, 4).map((change) => change.field).join(', ')}
                </p>
              )}
            </div>
          ))}
          {hasMore && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
              Ver mais registros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

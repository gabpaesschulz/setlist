import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { OperationalTimelineSection } from '@/components/events/operational-timeline-section'
import type { EventAuditLog } from '@/types'

vi.mock('@/components/ui/select', () => {
  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string
      onValueChange: (value: string) => void
      children: ReactNode
    }) => (
      <select aria-label="mock-select" value={value} onChange={(event) => onValueChange(event.target.value)}>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
  }
})

function buildLog(
  index: number,
  action: EventAuditLog['action'] = 'create',
  createdAt = new Date(2026, 0, index + 1).toISOString(),
): EventAuditLog {
  return {
    id: `log-${index}`,
    eventId: 'event-1',
    entityType: 'expense',
    action,
    source: 'manual',
    summary: `Log ${index}`,
    changes: [],
    createdAt,
  }
}

describe('OperationalTimelineSection integração', () => {
  it('paginaa histórico e exibe mais registros sob demanda', () => {
    const logs = Array.from({ length: 9 }, (_, index) => buildLog(index + 1))
    render(<OperationalTimelineSection auditLogs={logs} />)

    expect(screen.getByText('Log 1')).toBeInTheDocument()
    expect(screen.getByText('Log 8')).toBeInTheDocument()
    expect(screen.queryByText('Log 9')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /ver mais registros/i }))

    expect(screen.getByText('Log 9')).toBeInTheDocument()
  })

  it('filtra histórico por ação', () => {
    const logs = [buildLog(1, 'create'), buildLog(2, 'complete')]
    render(<OperationalTimelineSection auditLogs={logs} />)

    const actionFilter = screen.getAllByLabelText(/mock-select/i)[0]
    fireEvent.change(actionFilter, { target: { value: 'complete' } })

    expect(screen.getByText('Log 2')).toBeInTheDocument()
    expect(screen.queryByText('Log 1')).not.toBeInTheDocument()
  })

  it('exibe estado vazio quando não há registros', () => {
    render(<OperationalTimelineSection auditLogs={[]} />)
    expect(screen.getByText(/sem alterações registradas/i)).toBeInTheDocument()
  })

  it('filtra histórico por período', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-16T10:00:00.000Z'))
    const logs = [
      buildLog(1, 'create', '2026-03-15T10:00:00.000Z'),
      buildLog(2, 'create', '2025-11-01T10:00:00.000Z'),
    ]
    render(<OperationalTimelineSection auditLogs={logs} />)

    const periodFilter = screen.getAllByLabelText(/mock-select/i)[2]
    fireEvent.change(periodFilter, { target: { value: '7d' } })

    expect(screen.getByText('Log 1')).toBeInTheDocument()
    expect(screen.queryByText('Log 2')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventForm } from '@/components/events/event-form'
import type { EventWithRelations } from '@/types'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  addEvent: vi.fn(),
  updateEvent: vi.fn(),
  upsertTicket: vi.fn(),
  upsertTravel: vi.fn(),
  upsertLodging: vi.fn(),
  addChecklistItem: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}))

vi.mock('@/stores/events-store', () => ({
  useEventsStore: (selector: (store: unknown) => unknown) =>
    selector({
      addEvent: mocks.addEvent,
      updateEvent: mocks.updateEvent,
      upsertTicket: mocks.upsertTicket,
      upsertTravel: mocks.upsertTravel,
      upsertLodging: mocks.upsertLodging,
      addChecklistItem: mocks.addChecklistItem,
    }),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: mocks.toast,
}))

const initialData: EventWithRelations = {
  event: {
    id: 'event-1',
    title: 'Show teste',
    artist: 'Artista teste',
    type: 'show',
    status: 'ativo',
    date: '2026-08-10',
    city: 'São Paulo',
    state: 'SP',
    venue: 'Arena',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  expenses: [],
  itinerary: [],
  checklist: [],
}

function getInputByFieldLabel(fieldLabel: string): HTMLInputElement {
  const label = screen.getByText(fieldLabel)
  const fieldContainer = label.closest('div')
  if (!fieldContainer) {
    throw new Error(`Campo não encontrado: ${fieldLabel}`)
  }
  return within(fieldContainer).getByRole('spinbutton')
}

describe('EventForm orçamento por evento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateEvent.mockResolvedValue(initialData.event)
    mocks.upsertTicket.mockResolvedValue(undefined)
    mocks.upsertTravel.mockResolvedValue(undefined)
    mocks.upsertLodging.mockResolvedValue(undefined)
  })

  it('salva orçamento total e orçamento por categoria no update do evento', async () => {
    render(<EventForm mode="edit" initialData={initialData} />)

    fireEvent.change(getInputByFieldLabel('Orçamento total (R$)'), {
      target: { value: '1200' },
    })
    fireEvent.change(getInputByFieldLabel('🎟️ Ingresso'), {
      target: { value: '450' },
    })

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(mocks.updateEvent).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({
          budgetTotal: 1200,
          budgetByCategory: {
            ingresso: 450,
          },
        }),
      )
    })
  })
})

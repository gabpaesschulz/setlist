import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventForm } from '@/components/events/event-form'

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

describe('EventForm importação de URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('importa URL do Sympla e preenche campos do formulário', async () => {
    render(<EventForm mode="create" />)

    fireEvent.click(screen.getAllByRole('button', { name: /ingresso/i })[0])

    const importInput = await screen.findByPlaceholderText('Cole o link do Sympla ou Eventim')
    fireEvent.change(importInput, {
      target: {
        value: 'https://www.sympla.com.br/evento/metallica-em-sao-paulo/2873927?date=2026-09-12',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /importar url/i }))

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Importação concluída' }),
      )
    })

    expect(screen.getByPlaceholderText('https://...')).toHaveValue(
      'https://www.sympla.com.br/evento/metallica-em-sao-paulo/2873927?date=2026-09-12',
    )
  })
})

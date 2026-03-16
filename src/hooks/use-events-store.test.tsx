import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEventsStore } from '@/stores/events-store'
import { useInitEventsStore } from '@/hooks/use-events-store'

vi.mock('@/stores/events-store', () => ({
  useEventsStore: vi.fn(),
}))

describe('useInitEventsStore', () => {
  it('executa hidratação inicial e retorna estado derivado', async () => {
    const ensureHydrated = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useEventsStore).mockImplementation((selector) =>
      selector({
        ensureHydrated,
        loading: true,
        isHydrated: false,
      } as never),
    )

    const { result } = renderHook(() => useInitEventsStore())

    await waitFor(() => {
      expect(ensureHydrated).toHaveBeenCalledTimes(1)
    })
    expect(result.current).toEqual({ loading: true, isHydrated: false })
  })
})

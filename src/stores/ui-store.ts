import { create } from 'zustand'
import type { EventType, EventStatus } from '@/types'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface UIStore {
  activeTab: string
  setActiveTab: (tab: string) => void

  isAddEventOpen: boolean
  setIsAddEventOpen: (open: boolean) => void

  searchQuery: string
  setSearchQuery: (q: string) => void

  filters: {
    type?: EventType
    status?: EventStatus
    city?: string
    month?: string
    upcoming?: boolean
  }
  setFilters: (filters: Partial<UIStore['filters']>) => void
  clearFilters: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'events',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isAddEventOpen: false,
  setIsAddEventOpen: (open) => set({ isAddEventOpen: open }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  filters: {},
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  clearFilters: () => set({ filters: {} }),
}))

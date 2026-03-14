import type { ChecklistItem } from '@/types'
import { DEFAULT_CHECKLIST_ITEMS } from '@/lib/constants'

// ─── Generation ───────────────────────────────────────────────────────────────

/**
 * Generates the default checklist items for a new event.
 * IDs are intentionally omitted — the caller is responsible for assigning them
 * (e.g. using crypto.randomUUID() or a Dexie auto-increment).
 */
export function generateDefaultChecklist(eventId: string): Omit<ChecklistItem, 'id'>[] {
  return DEFAULT_CHECKLIST_ITEMS.map((label, index) => ({
    eventId,
    label,
    done: false,
    isDefault: true,
    order: index,
  }))
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * Returns the number of completed items, the total number of items, and a
 * 0–100 percentage representing overall checklist completion.
 *
 * When there are no items all values are 0.
 */
export function getChecklistProgress(items: ChecklistItem[]): {
  done: number
  total: number
  percentage: number
} {
  const total = items.length
  if (total === 0) return { done: 0, total: 0, percentage: 0 }

  const done = items.filter((item) => item.done).length
  const percentage = Math.round((done / total) * 100)

  return { done, total, percentage }
}

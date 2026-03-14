import type { EventWithRelations, ReadinessLevel, ReadinessScore } from '@/types'

// ─── Score Calculation ────────────────────────────────────────────────────────

/**
 * Calculates a 0–100 readiness score for an event based on how much of the
 * planning data has been filled in.
 *
 * Weight breakdown:
 *   20%  — Basic event fields complete
 *   25%  — Ticket purchased
 *   25%  — Travel booked
 *   15%  — Lodging confirmed (only when lodging is required)
 *   15%  — Checklist progress
 */
export function calculateReadiness(data: EventWithRelations): ReadinessScore {
  let score = 0

  // ── 1. Basic event fields (20 pts) ─────────────────────────────────────────
  const { event } = data
  const basicFields = [event.title, event.artist, event.city, event.state, event.venue, event.date]
  const filledBasic = basicFields.filter(Boolean).length
  const basicScore = Math.round((filledBasic / basicFields.length) * 20)
  score += basicScore

  // ── 2. Ticket purchased (25 pts) ───────────────────────────────────────────
  if (data.ticket?.purchased) {
    score += 25
  } else if (data.ticket) {
    // Partial credit: ticket exists but not yet purchased
    score += 8
  }

  // ── 3. Travel booked (25 pts) ──────────────────────────────────────────────
  if (data.travel?.booked) {
    score += 25
  } else if (data.travel) {
    // Partial credit: travel info exists but not yet booked
    score += 8
  }

  // ── 4. Lodging confirmed (15 pts) ──────────────────────────────────────────
  if (data.lodging?.required) {
    if (data.lodging.confirmed) {
      score += 15
    } else {
      // Partial credit: lodging required but not confirmed
      score += 5
    }
  } else if (!data.lodging || data.lodging.required === false) {
    // Lodging not required — award full points automatically
    score += 15
  }

  // ── 5. Checklist progress (15 pts) ─────────────────────────────────────────
  const { checklist } = data
  if (checklist.length > 0) {
    const done = checklist.filter((item) => item.done).length
    const checklistScore = Math.round((done / checklist.length) * 15)
    score += checklistScore
  } else {
    // No checklist items — award full points so missing checklist doesn't penalise score
    score += 15
  }

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score))

  const level = getReadinessLevel(score)
  const label = getReadinessLabel(level)

  return { score, level, label }
}

// ─── Level Derivation ─────────────────────────────────────────────────────────

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return 'pronto'
  if (score >= 60) return 'quase_pronto'
  if (score >= 25) return 'organizando'
  return 'em_aberto'
}

// ─── Label Helpers ────────────────────────────────────────────────────────────

/**
 * Returns a human-readable Portuguese label for a readiness level.
 */
export function getReadinessLabel(level: ReadinessLevel): string {
  const labels: Record<ReadinessLevel, string> = {
    em_aberto: 'Em Aberto',
    organizando: 'Organizando',
    quase_pronto: 'Quase Pronto',
    pronto: 'Pronto!',
  }
  return labels[level]
}

/**
 * Returns a Tailwind CSS text-color class for a readiness level.
 */
export function getReadinessColor(level: ReadinessLevel): string {
  const colors: Record<ReadinessLevel, string> = {
    em_aberto: 'text-gray-500',
    organizando: 'text-yellow-600',
    quase_pronto: 'text-blue-600',
    pronto: 'text-green-600',
  }
  return colors[level]
}

/**
 * Returns a Tailwind CSS background-color class for a readiness level.
 */
export function getReadinessBgColor(level: ReadinessLevel): string {
  const colors: Record<ReadinessLevel, string> = {
    em_aberto: 'bg-gray-100',
    organizando: 'bg-yellow-100',
    quase_pronto: 'bg-blue-100',
    pronto: 'bg-green-100',
  }
  return colors[level]
}

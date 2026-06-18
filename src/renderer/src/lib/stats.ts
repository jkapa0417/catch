import type { Note } from '@shared/types'
import { scoreNote } from './scoring'

/** Real "Note Muscle" stats, derived from actual notes (no fabricated numbers). */

function addDays(dateStr: string, delta: number): string {
  // Stay in UTC throughout — note dates are produced with toISOString (UTC), so
  // local-time arithmetic would shift the date by one in non-UTC timezones.
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

/** Consecutive days, ending today, on which at least one item was captured. */
export function captureStreak(notes: Note[], today: string): number {
  const activeDays = new Set(notes.filter((n) => n.items.length > 0).map((n) => n.date))
  let streak = 0
  let cursor = today
  while (activeDays.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/**
 * Change in average note score: the last 7 days vs the 7 days before that.
 * Returns null when either window has no scored notes (so the UI can show "—").
 */
export function weekScoreDelta(notes: Note[], today: string): number | null {
  const avg = (from: string, to: string): number | null => {
    const scores = notes
      .filter((n) => n.date >= from && n.date <= to)
      .map((n) => scoreNote(n).overall)
      .filter((v): v is number => v !== null)
    if (!scores.length) return null
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }
  const thisWeek = avg(addDays(today, -6), today)
  const lastWeek = avg(addDays(today, -13), addDays(today, -7))
  if (thisWeek === null || lastWeek === null) return null
  return Math.round(thisWeek - lastWeek)
}

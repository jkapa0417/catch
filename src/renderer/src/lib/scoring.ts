import type { Note } from '@shared/types'
import { ACTION_CATS, DUE_RE, VAGUE } from './constants'
import { iko } from './notes'

export interface CritScore {
  pct: number | null
}

export interface ScoreResult {
  overall: number | null
  crit: Record<string, CritScore>
}

/**
 * Score a note 0–100 across five criteria. Language-agnostic: always evaluates
 * the Korean text so a note scores identically in either UI language. Ported
 * verbatim from the design's scoreNote.
 */
export function scoreNote(note: Note): ScoreResult {
  const lines = note.items.map((i) => iko(i))
  const n = lines.length
  if (!n) return { overall: null, crit: {} }

  const out: Record<string, CritScore> = {}

  // Brevity — share of lines ≤ 45 characters.
  let okB = 0
  lines.forEach((t) => {
    if ([...t].length <= 45) okB++
  })
  out.brevity = { pct: Math.round((okB / n) * 100) }

  // Clarity — share of lines without vague filler words.
  let okC = 0
  lines.forEach((t) => {
    if (!VAGUE.some((v) => t.includes(v))) okC++
  })
  out.clarity = { pct: Math.round((okC / n) * 100) }

  // One idea — penalize lines stuffed with multiple clauses.
  let okO = 0
  lines.forEach((t) => {
    const hits = (t.match(/(그리고|및|,|·|\/)/g) || []).length
    if (hits >= 2 || (hits >= 1 && [...t].length > 22 && /(하고|하기로|받고|검토|작성)/.test(t))) {
      // crowded line — not counted
    } else okO++
  })
  out.oneidea = { pct: Math.round((okO / n) * 100) }

  // Actionable — owner + due-date presence among committed action items.
  const acts = note.items.filter((i) => (ACTION_CATS[note.mode] || []).includes(i.cat))
  if (acts.length) {
    let wo = 0
    let wd = 0
    acts.forEach((i) => {
      if (i.owner) wo++
      if (DUE_RE.test(iko(i))) wd++
    })
    out.action = { pct: Math.round((wo / acts.length) * 70 + (wd / acts.length) * 30) }
  } else out.action = { pct: null }

  // Complete — meetings should carry both a decision and an action.
  if (note.mode === 'meeting') {
    const has = (k: string) => note.items.some((i) => i.cat === k)
    let sc = 100
    if (has('discussion') || n >= 3) {
      if (!has('decision')) sc -= 40
      if (!has('action')) sc -= 40
    }
    out.complete = { pct: Math.max(sc, 0) }
  } else out.complete = { pct: null }

  const vals = Object.values(out)
    .map((c) => c.pct)
    .filter((v): v is number => v !== null)
  return {
    overall: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
    crit: out
  }
}

export function barColor(s: number): string {
  return s >= 80 ? '#1B9C72' : s >= 55 ? '#D69A00' : '#D6566A'
}

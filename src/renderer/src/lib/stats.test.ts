import { describe, expect, it } from 'vitest'
import type { Note, NoteItem } from '@shared/types'
import { captureStreak, weekScoreDelta } from './stats'

const item = (cat: string, text: string): NoteItem => ({
  id: Math.random().toString(36).slice(2),
  cat,
  text,
  owner: '',
  by: 'self'
})

const note = (date: string, items: NoteItem[], mode: Note['mode'] = 'brainstorm'): Note => ({
  id: Math.random().toString(36).slice(2),
  projectId: 'p',
  mode,
  title: 't',
  date,
  items
})

describe('captureStreak', () => {
  it('is 0 for a brand-new user with no captured items', () => {
    expect(captureStreak([note('2026-06-18', [])], '2026-06-18')).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const notes = [
      note('2026-06-18', [item('idea', 'a')]),
      note('2026-06-17', [item('idea', 'b')]),
      note('2026-06-16', [item('idea', 'c')])
    ]
    expect(captureStreak(notes, '2026-06-18')).toBe(3)
  })

  it('breaks the streak on a gap day', () => {
    const notes = [
      note('2026-06-18', [item('idea', 'a')]),
      note('2026-06-16', [item('idea', 'c')]) // 17th missing
    ]
    expect(captureStreak(notes, '2026-06-18')).toBe(1)
  })

  it('is 0 when nothing was captured today', () => {
    expect(captureStreak([note('2026-06-17', [item('idea', 'a')])], '2026-06-18')).toBe(0)
  })
})

describe('weekScoreDelta', () => {
  it('returns null without two weeks of data', () => {
    expect(weekScoreDelta([note('2026-06-18', [item('idea', 'a')])], '2026-06-18')).toBeNull()
  })

  it('computes the change between this week and the previous week', () => {
    const notes = [
      // this week — short, clear lines score high
      note('2026-06-17', [item('idea', '짧고 명료한 메모')]),
      // previous week — a vague filler line scores lower on clarity
      note('2026-06-09', [item('idea', '나중에 대충 정리')])
    ]
    const delta = weekScoreDelta(notes, '2026-06-18')
    expect(delta).not.toBeNull()
    expect(delta!).toBeGreaterThan(0)
  })
})

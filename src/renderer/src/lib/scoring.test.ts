import { describe, expect, it } from 'vitest'
import type { Note, NoteItem } from '@shared/types'
import { barColor, scoreNote } from './scoring'

const item = (cat: string, text: string, owner = ''): NoteItem => ({
  id: Math.random().toString(36).slice(2),
  cat,
  text,
  owner,
  by: 'self'
})

const note = (mode: Note['mode'], items: NoteItem[]): Note => ({
  id: 'n',
  projectId: 'p',
  mode,
  title: 't',
  date: '2026-06-18',
  items
})

describe('scoreNote', () => {
  it('returns null overall for an empty note', () => {
    expect(scoreNote(note('meeting', [])).overall).toBeNull()
  })

  it('scores brevity by line length', () => {
    const short = scoreNote(note('brainstorm', [item('idea', '짧은 메모')]))
    expect(short.crit.brevity.pct).toBe(100)

    const long = scoreNote(
      note('brainstorm', [item('idea', '가'.repeat(60))])
    )
    expect(long.crit.brevity.pct).toBe(0)
  })

  it('penalizes vague filler words in clarity', () => {
    const vague = scoreNote(note('brainstorm', [item('idea', '나중에 대충 정리')]))
    expect(vague.crit.clarity.pct).toBe(0)
    const clear = scoreNote(note('brainstorm', [item('idea', '온보딩 카피 작성')]))
    expect(clear.crit.clarity.pct).toBe(100)
  })

  it('rewards action items with owner and due date', () => {
    const good = scoreNote(note('meeting', [item('action', '카피 작성 — 금요일까지', '지민')]))
    expect(good.crit.action.pct).toBe(100)
    const noOwnerNoDue = scoreNote(note('meeting', [item('action', '카피 작성')]))
    expect(noOwnerNoDue.crit.action.pct).toBe(0)
  })

  it('marks completeness null for non-meeting modes', () => {
    expect(scoreNote(note('daily', [item('done', '한 일')])).crit.complete.pct).toBeNull()
  })

  it('docks completeness when a meeting lacks decisions/actions', () => {
    const incomplete = scoreNote(
      note('meeting', [
        item('discussion', '논의1'),
        item('discussion', '논의2'),
        item('question', '질문1')
      ])
    )
    expect(incomplete.crit.complete.pct).toBe(20) // 100 - 40 - 40
  })

  it('produces an overall average of applicable criteria', () => {
    const r = scoreNote(
      note('meeting', [
        item('decision', '출시 확정'),
        item('action', '메일 발송 — 6/25', '현우')
      ])
    )
    expect(r.overall).not.toBeNull()
    expect(r.overall).toBeGreaterThan(0)
    expect(r.overall).toBeLessThanOrEqual(100)
  })
})

describe('barColor', () => {
  it('maps score ranges to colors', () => {
    expect(barColor(90)).toBe('#1B9C72')
    expect(barColor(60)).toBe('#D69A00')
    expect(barColor(20)).toBe('#D6566A')
  })
})

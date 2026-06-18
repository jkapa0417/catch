import { describe, expect, it } from 'vitest'
import type { Note } from '@shared/types'
import { buildExport } from './markdown'

const note: Note = {
  id: 'n1',
  projectId: 'p1',
  mode: 'meeting',
  title: { ko: '로드맵 회의', en: 'Roadmap meeting' },
  date: '2026-06-17',
  items: [
    { id: 'a', cat: 'decision', text: { ko: '출시 확정', en: 'Ship confirmed' }, owner: '', by: 'self' },
    { id: 'b', cat: 'action', text: { ko: '메일 발송', en: 'Send email' }, owner: '현우', by: 'self' }
  ]
}

describe('buildExport', () => {
  it('renders grouped markdown with a title heading', () => {
    const out = buildExport(note, 'en')
    expect(out.title).toBe('Roadmap meeting')
    expect(out.markdown).toContain('# Roadmap meeting')
    expect(out.markdown).toContain('## Decision')
    expect(out.markdown).toContain('- Ship confirmed')
    expect(out.markdown).toContain('- Send email @Hyunwoo')
  })

  it('localizes to Korean and builds a dated filename', () => {
    const out = buildExport(note, 'ko')
    expect(out.markdown).toContain('# 로드맵 회의')
    expect(out.markdown).toContain('## 결정')
    expect(out.filename).toBe('로드맵-회의-2026-06-17')
  })

  it('produces plain text without markdown headings', () => {
    const out = buildExport(note, 'en')
    expect(out.plain).toContain('[Decision]')
    expect(out.plain).not.toContain('##')
  })
})

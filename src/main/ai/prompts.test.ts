import { describe, expect, it } from 'vitest'
import { buildEvalPrompt, buildOrganizePrompt, extractJson } from './prompts'

describe('buildOrganizePrompt', () => {
  it('lists the mode categories and demands strict JSON', () => {
    const { system, user } = buildOrganizePrompt({
      mode: 'meeting',
      categories: ['decision', 'action', 'discussion', 'question'],
      rawText: '로고 보류하기로 함. 경쟁사 조사 공유 @민지',
      lang: 'ko'
    })
    expect(system).toContain('"decision"')
    expect(system).toContain('"action"')
    expect(system).toContain('STRICT JSON')
    expect(user).toContain('경쟁사 조사')
  })
})

describe('buildEvalPrompt', () => {
  it('renders items and requests a JSON review shape', () => {
    const { system, user } = buildEvalPrompt({
      mode: 'daily',
      lang: 'en',
      items: [{ cat: 'done', text: 'Wrote copy', owner: 'Jimin' }]
    })
    expect(system).toContain('"good"')
    expect(system).toContain('"improve"')
    expect(user).toContain('[done] Wrote copy (@Jimin)')
  })
})

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 })
  })

  it('strips ```json fences', () => {
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 })
  })

  it('recovers JSON embedded in prose', () => {
    expect(extractJson('Sure! Here you go: {"items":[]} — done')).toEqual({ items: [] })
  })

  it('parses a bare array', () => {
    expect(extractJson('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('throws on non-JSON', () => {
    expect(() => extractJson('not json at all')).toThrow()
  })
})

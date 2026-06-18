import type { Mode } from '@shared/types'

/** Category color palette (ported verbatim from the design). */
export const HUE: Record<string, { fg: string; bg: string; dot: string; bd: string }> = {
  amber: { fg: '#8a6300', bg: '#FBEFC6', dot: '#D69A00', bd: '#F0DC9A' },
  green: { fg: '#0f6a4c', bg: '#D4EFE3', dot: '#1B9C72', bd: '#A9E0CB' },
  blue: { fg: '#2a4ca0', bg: '#DBE5FB', dot: '#3866D6', bd: '#B8CBF4' },
  violet: { fg: '#7d3372', bg: '#F2DCEE', dot: '#A8489A', bd: '#E3BCDC' },
  rose: { fg: '#a83448', bg: '#F8DCE1', dot: '#D6566A', bd: '#EFBAC3' },
  slate: { fg: '#3f4c59', bg: '#E4E9EE', dot: '#64748b', bd: '#CBD3DA' }
}

export interface ModeDef {
  accent: string
  cats: { k: string; h: keyof typeof HUE }[]
}

export const MODES: Record<Mode, ModeDef> = {
  meeting: {
    accent: '#3866D6',
    cats: [
      { k: 'decision', h: 'amber' },
      { k: 'action', h: 'green' },
      { k: 'discussion', h: 'blue' },
      { k: 'question', h: 'violet' }
    ]
  },
  brainstorm: {
    accent: '#D69A00',
    cats: [
      { k: 'idea', h: 'amber' },
      { k: 'develop', h: 'green' },
      { k: 'question', h: 'violet' },
      { k: 'note', h: 'slate' }
    ]
  },
  switch: {
    accent: '#A8489A',
    cats: [
      { k: 'doing', h: 'blue' },
      { k: 'next', h: 'green' },
      { k: 'block', h: 'rose' },
      { k: 'note', h: 'slate' }
    ]
  },
  daily: {
    accent: '#1B9C72',
    cats: [
      { k: 'done', h: 'green' },
      { k: 'todo', h: 'blue' },
      { k: 'learned', h: 'amber' },
      { k: 'block', h: 'rose' }
    ]
  }
}

export const CATLABEL: Record<string, { ko: string; en: string }> = {
  decision: { ko: '결정', en: 'Decision' },
  action: { ko: '할 일', en: 'Action' },
  discussion: { ko: '논의', en: 'Discussion' },
  question: { ko: '질문', en: 'Question' },
  idea: { ko: '아이디어', en: 'Idea' },
  develop: { ko: '발전', en: 'Develop' },
  note: { ko: '메모', en: 'Note' },
  doing: { ko: '하던 일', en: 'Doing' },
  next: { ko: '다음 할 일', en: 'Next' },
  block: { ko: '막힌 것', en: 'Blocked' },
  done: { ko: '한 일', en: 'Done' },
  todo: { ko: '할 일', en: 'To-do' },
  learned: { ko: '배운 것', en: 'Learned' }
}

export const OWNERMAP: Record<string, string> = {
  지민: 'Jimin',
  현우: 'Hyunwoo',
  수아: 'Sua',
  민지: 'Minji'
}

/** Which categories represent committed "actions" per mode (for scoring). */
export const ACTION_CATS: Record<Mode, string[]> = {
  meeting: ['action'],
  brainstorm: [],
  switch: ['next'],
  daily: ['todo']
}

export const VAGUE = ['나중에', '조만간', '언젠가', '좀 ', '대충', '적당히', '알아서', '어떻게든', '추후']

export const DUE_RE =
  /(까지|오늘|내일|모레|이번\s?주|다음\s?주|[월화수목금토일]요일|\d{1,2}\s?월|\d{1,2}\/\d{1,2}|\d{1,2}\s?일)/

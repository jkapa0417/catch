import type { AiEvalRequest, AiOrganizeRequest, Lang, Mode } from '@shared/types'

/**
 * Pure prompt builders + a tolerant JSON extractor. Kept free of Electron/network
 * imports so they can be unit-tested in plain Node.
 */

// Human descriptions for every category key across the four modes, in both
// languages — gives the model enough grounding to classify correctly.
const CAT_GUIDE: Record<string, { ko: string; en: string }> = {
  decision: { ko: '확정된 결정 사항', en: 'a firm decision that was made' },
  action: { ko: '실행할 일 (담당자/기한)', en: 'an action to do (owner / due date)' },
  discussion: { ko: '논의했지만 결론 안 난 것', en: 'something discussed but not concluded' },
  question: { ko: '아직 답이 없는 질문', en: 'an open question with no answer yet' },
  idea: { ko: '떠오른 아이디어', en: 'a raw idea' },
  develop: { ko: '발전시킬 만한 아이디어', en: 'an idea worth developing further' },
  note: { ko: '참고 메모', en: 'a reference note' },
  doing: { ko: '지금 하던 일', en: 'what you were doing' },
  next: { ko: '다음에 할 일', en: 'what to do next' },
  block: { ko: '막힌 것 / 블로커', en: 'a blocker' },
  done: { ko: '오늘 한 일', en: 'what was done today' },
  todo: { ko: '해야 할 일', en: 'a to-do' },
  learned: { ko: '배운 것', en: 'something learned' }
}

const MODE_NAME: Record<Mode, { ko: string; en: string }> = {
  meeting: { ko: '회의', en: 'meeting' },
  brainstorm: { ko: '브레인스토밍', en: 'brainstorming' },
  switch: { ko: '작업 전환', en: 'task switch' },
  daily: { ko: '하루 정리', en: 'daily wrap-up' }
}

function catLines(categories: string[], lang: Lang): string {
  return categories
    .map((k) => {
      const g = CAT_GUIDE[k]
      return `- "${k}": ${g ? g[lang] : k}`
    })
    .join('\n')
}

export interface BuiltPrompt {
  system: string
  user: string
}

export function buildOrganizePrompt(
  req: Pick<AiOrganizeRequest, 'mode' | 'categories' | 'rawText' | 'lang'>
): BuiltPrompt {
  const { mode, categories, rawText, lang } = req
  const modeName = MODE_NAME[mode][lang]
  const langName = lang === 'ko' ? 'Korean' : 'English'

  const system =
    `You are Catch, an assistant that turns messy raw notes into clean, classified note items for a "${modeName}" note.\n` +
    `Classify each meaningful line into exactly ONE of these categories:\n` +
    catLines(categories, lang) +
    `\n\nRules:\n` +
    `- Output STRICT JSON only, no prose, shaped as {"items":[{"cat":"<one of the category keys>","text":"<short cleaned line>","owner":"<name or empty string>"}]}.\n` +
    `- "cat" MUST be one of: ${categories.map((c) => `"${c}"`).join(', ')}.\n` +
    `- Keep each "text" concise (ideally under ~45 characters), one idea per item, in ${langName}.\n` +
    `- If a person is responsible, put their name in "owner" (strip a leading @). Otherwise "owner" is "".\n` +
    `- Drop greetings/filler. Split lines that contain multiple ideas into multiple items.`

  const user = `Raw notes to organize:\n"""\n${rawText.trim()}\n"""`
  return { system, user }
}

export function buildEvalPrompt(req: Pick<AiEvalRequest, 'mode' | 'items' | 'lang'>): BuiltPrompt {
  const { mode, items, lang } = req
  const modeName = MODE_NAME[mode][lang]
  const langName = lang === 'ko' ? 'Korean' : 'English'

  const rendered = items
    .map((i) => `[${i.cat}] ${i.text}${i.owner ? ` (@${i.owner})` : ''}`)
    .join('\n')

  const system =
    `You are Catch, a kind but sharp note-taking coach reviewing a "${modeName}" note.\n` +
    `Give specific, encouraging, actionable feedback that helps the writer build the habit of clear notes.\n` +
    `Respond in ${langName}.\n` +
    `Output STRICT JSON only, shaped as ` +
    `{"good":"<what they did well, 1-2 sentences>","improve":"<the single most useful improvement, 1-2 sentences>",` +
    `"before":"<one weak line copied verbatim from the note>","after":"<your improved rewrite of that same line>"}.`

  const user = `Here is the note:\n${rendered}`
  return { system, user }
}

/**
 * Extract a JSON value from a model response that may wrap it in prose or
 * ```json fences. Returns the parsed value or throws.
 */
export function extractJson<T = unknown>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fall back to the first balanced {...} or [...] span.
    const start = cleaned.search(/[[{]/)
    if (start >= 0) {
      const open = cleaned[start]
      const close = open === '{' ? '}' : ']'
      const end = cleaned.lastIndexOf(close)
      if (end > start) {
        return JSON.parse(cleaned.slice(start, end + 1)) as T
      }
    }
    throw new Error('Model did not return valid JSON.')
  }
}

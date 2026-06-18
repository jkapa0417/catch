import type { Lang, Note, NoteItem, Project } from '@shared/types'
import { L } from './i18n'
import { OWNERMAP } from './constants'

/** Bilingual-or-plain text accessors, ported from the design helpers. */

export function itxt(i: NoteItem, lang: Lang): string {
  return typeof i.text === 'string' ? i.text : i.text[lang] || i.text.ko
}

/** Language-agnostic text used by the scorer (always the Korean variant). */
export function iko(i: NoteItem): string {
  return typeof i.text === 'string' ? i.text : i.text.ko
}

export function ntitle(n: Note, lang: Lang): string {
  const t = n.title
  const v = typeof t === 'string' ? t : t[lang] || t.ko
  return v || L[lang].modeLabel[n.mode]
}

export function pname(p: Project, lang: Lang): string {
  const t = p.name
  return typeof t === 'string' ? t : t[lang] || t.ko
}

export function ownerDisp(o: string, lang: Lang): string {
  return lang === 'en' ? OWNERMAP[o] || o : o
}

/** Pull an "@name" owner out of free text. */
export function parseOwner(t: string): { text: string; owner: string } {
  const m = t.match(/@([^\s,@]+)/)
  return m
    ? { text: t.replace(m[0], '').replace(/\s{2,}/g, ' ').trim(), owner: m[1] }
    : { text: t.trim(), owner: '' }
}

export function rid(): string {
  return Math.random().toString(36).slice(2, 8)
}

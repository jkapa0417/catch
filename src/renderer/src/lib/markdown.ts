import type { Lang, Note } from '@shared/types'
import { CATLABEL, MODES } from './constants'
import { L } from './i18n'
import { itxt, ntitle, ownerDisp } from './notes'

/** Render a note to Markdown / plain text for the export + copy actions. */

function catLabel(k: string, lang: Lang): string {
  const c = CATLABEL[k]
  return c ? c[lang] : k
}

interface Built {
  title: string
  filename: string
  markdown: string
  plain: string
}

export function buildExport(note: Note, lang: Lang): Built {
  const title = ntitle(note, lang)
  const modeLabel = L[lang].modeLabel[note.mode]
  const lines: string[] = [`# ${title}`, '', `*${modeLabel} · ${note.date}*`, '']
  const plainLines: string[] = [`${title} (${modeLabel} · ${note.date})`, '']

  for (const c of MODES[note.mode].cats) {
    const sub = note.items.filter((i) => i.cat === c.k)
    if (!sub.length) continue
    const label = catLabel(c.k, lang)
    lines.push(`## ${label}`)
    plainLines.push(`[${label}]`)
    for (const i of sub) {
      const owner = i.owner ? ` @${ownerDisp(i.owner, lang)}` : ''
      lines.push(`- ${itxt(i, lang)}${owner}`)
      plainLines.push(`- ${itxt(i, lang)}${owner}`)
    }
    lines.push('')
    plainLines.push('')
  }

  const safeTitle = title.replace(/\s+/g, '-')
  return {
    title,
    filename: `${safeTitle}-${note.date}`,
    markdown: lines.join('\n').trim() + '\n',
    plain: plainLines.join('\n').trim() + '\n'
  }
}

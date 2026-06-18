import { BrowserWindow, clipboard, dialog, net, shell } from 'electron'
import { writeFile } from 'fs/promises'
import type { ExportPayload, ExportResult } from '@shared/types'

/** Real export sinks: file system, OS clipboard, Obsidian URI, Notion API. */

function safeName(name: string): string {
  return (name || 'catch-note').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120) || 'catch-note'
}

export async function exportMarkdown(
  win: BrowserWindow | null,
  payload: ExportPayload
): Promise<ExportResult> {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(win ?? undefined!, {
      title: 'Export note as Markdown',
      defaultPath: `${safeName(payload.filename)}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (canceled || !filePath) return { ok: false, cancelled: true }
    await writeFile(filePath, payload.markdown, 'utf8')
    return { ok: true, target: filePath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save file.' }
  }
}

export function copyText(text: string): void {
  clipboard.writeText(text)
}

export async function openObsidian(
  payload: ExportPayload,
  opts: { vault: string }
): Promise<ExportResult> {
  try {
    const vault = opts.vault.trim()
    const params = new URLSearchParams()
    if (vault) params.set('vault', vault)
    params.set('name', payload.title || payload.filename)
    params.set('content', payload.markdown)
    await shell.openExternal(`obsidian://new?${params.toString()}`)
    return { ok: true, target: 'obsidian' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not open Obsidian.' }
  }
}

/**
 * Create a Notion page from the note. Requires an integration token and a
 * parent page id (both via env). Markdown is sent as paragraph blocks so the
 * content is real, not a stub.
 */
export async function exportNotion(
  payload: ExportPayload,
  opts: { token: string; parentId: string }
): Promise<ExportResult> {
  const token = opts.token.trim()
  const parent = opts.parentId.trim()
  if (!token || !parent) {
    return {
      ok: false,
      error: 'Notion is not configured. Add a token and parent page ID in Settings.'
    }
  }
  try {
    const blocks = payload.markdown
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 95) // Notion caps children per request at 100
      .map((line) => markdownLineToBlock(line))

    const res = await net.fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        parent: { page_id: parent },
        properties: { title: [{ text: { content: payload.title || 'Catch note' } }] },
        children: blocks
      })
    })
    const text = await res.text()
    if (!res.ok) {
      let detail = ''
      try {
        detail = JSON.parse(text)?.message ?? ''
      } catch {
        detail = text.slice(0, 160)
      }
      return { ok: false, error: `Notion error ${res.status}. ${detail}`.trim() }
    }
    const url = JSON.parse(text)?.url
    return { ok: true, target: url }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to reach Notion.' }
  }
}

function markdownLineToBlock(line: string): Record<string, unknown> {
  const rich = (content: string) => [{ type: 'text', text: { content: content.slice(0, 1900) } }]
  if (line.startsWith('# '))
    return { object: 'block', type: 'heading_1', heading_1: { rich_text: rich(line.slice(2)) } }
  if (line.startsWith('## '))
    return { object: 'block', type: 'heading_2', heading_2: { rich_text: rich(line.slice(3)) } }
  if (line.startsWith('### '))
    return { object: 'block', type: 'heading_3', heading_3: { rich_text: rich(line.slice(4)) } }
  if (/^[-*] /.test(line))
    return {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: rich(line.slice(2)) }
    }
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: rich(line) } }
}

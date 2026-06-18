import type {
  AiEvalRequest,
  AiEvalResult,
  AiOrganizeItem,
  AiOrganizeRequest,
  ResolvedEndpoint,
  Result
} from '@shared/types'
import { getApiKey, hasStoredEntry } from '../store'
import { callLLM, ProviderError } from './providers'
import { buildEvalPrompt, buildOrganizePrompt, extractJson } from './prompts'

const KEY_UNREADABLE =
  'Your saved API key could not be read (it may have been saved on a different OS user or machine). Please re-enter it in Settings.'
const KEY_MISSING = 'Connect an AI provider in Settings first.'

/** Validate a resolved endpoint just before calling; returns an error or null. */
function readinessError(
  req: { provider: string; api: string; baseUrl: string; model: string; keyOptional?: boolean },
  hasKey: boolean
): string | null {
  if (req.api === 'openai-compat' && !req.baseUrl) return 'Set a base URL for this provider in Settings.'
  if (!req.model) return 'Set a model for this provider in Settings.'
  const needsKey = !req.keyOptional || req.api === 'azure'
  if (needsKey && !hasKey) return hasStoredEntry(req.provider) ? KEY_UNREADABLE : KEY_MISSING
  return null
}

const TIMEOUT_MS = 30_000

function withTimeout(): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  return { signal: ctrl.signal, done: () => clearTimeout(t) }
}

function toMessage(err: unknown): string {
  if (err instanceof ProviderError) return err.message
  if (err instanceof Error) {
    if (err.name === 'AbortError') return 'The AI request timed out. Try again.'
    if (
      /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|getaddrinfo|ERR_|ECONNRESET|ETIMEDOUT|network|proxy|tunnel|certificate|self.signed|unable to (get|verify)/i.test(
        err.message
      )
    )
      return `Could not reach the AI provider (${err.message}). Check your network, VPN/proxy, or that a local model (Ollama) is running.`
    return err.message
  }
  return 'Unknown error.'
}

/**
 * Confirm a provider is actually usable by issuing a tiny real request. Used by
 * the Settings "Connect" button so it reflects genuine connectivity, not just
 * "a key was typed".
 */
export async function verifyProvider(req: ResolvedEndpoint): Promise<Result<true>> {
  const apiKey = getApiKey(req.provider)
  const notReady = readinessError(req, !!apiKey)
  if (notReady) return { ok: false, error: notReady }
  const { signal, done } = withTimeout()
  try {
    await callLLM({
      api: req.api,
      baseUrl: req.baseUrl,
      model: req.model,
      apiKey,
      system: 'You are a connectivity check.',
      user: 'Reply with the single word OK.',
      maxTokens: 5,
      signal
    })
    return { ok: true, data: true }
  } catch (err) {
    return { ok: false, error: toMessage(err) }
  } finally {
    done()
  }
}

export async function aiOrganize(req: AiOrganizeRequest): Promise<Result<AiOrganizeItem[]>> {
  const apiKey = getApiKey(req.provider)
  const notReady = readinessError(req, !!apiKey)
  if (notReady) return { ok: false, error: notReady }
  if (!req.rawText.trim()) return { ok: false, error: 'Nothing to organize.' }

  const { system, user } = buildOrganizePrompt(req)
  const { signal, done } = withTimeout()
  try {
    const raw = await callLLM({
      api: req.api,
      baseUrl: req.baseUrl,
      model: req.model,
      apiKey,
      system,
      user,
      expectJson: true,
      signal
    })
    const parsed = extractJson<{ items?: AiOrganizeItem[] } | AiOrganizeItem[]>(raw)
    const list = Array.isArray(parsed) ? parsed : parsed.items ?? []
    const valid = req.categories
    const items: AiOrganizeItem[] = list
      .filter((i) => i && typeof i.text === 'string' && i.text.trim())
      .map((i) => ({
        cat: valid.includes(i.cat) ? i.cat : valid[valid.length - 1],
        text: String(i.text).trim(),
        owner: typeof i.owner === 'string' ? i.owner.replace(/^@/, '').trim() : ''
      }))
    if (!items.length) return { ok: false, error: 'The AI returned no usable items.' }
    return { ok: true, data: items }
  } catch (err) {
    return { ok: false, error: toMessage(err) }
  } finally {
    done()
  }
}

export async function aiEval(req: AiEvalRequest): Promise<Result<AiEvalResult>> {
  const apiKey = getApiKey(req.provider)
  const notReady = readinessError(req, !!apiKey)
  if (notReady) return { ok: false, error: notReady }
  if (!req.items.length) return { ok: false, error: 'Write some notes to review first.' }

  const { system, user } = buildEvalPrompt(req)
  const { signal, done } = withTimeout()
  try {
    const raw = await callLLM({
      api: req.api,
      baseUrl: req.baseUrl,
      model: req.model,
      apiKey,
      system,
      user,
      expectJson: true,
      signal
    })
    const p = extractJson<Partial<AiEvalResult>>(raw)
    const result: AiEvalResult = {
      good: (p.good ?? '').toString().trim(),
      improve: (p.improve ?? '').toString().trim(),
      before: (p.before ?? '').toString().trim(),
      after: (p.after ?? '').toString().trim()
    }
    if (!result.good && !result.improve) return { ok: false, error: 'The AI returned an empty review.' }
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: toMessage(err) }
  } finally {
    done()
  }
}

import { net } from 'electron'
import type { ProviderApi } from '@shared/types'

/**
 * Provider-agnostic LLM caller. One `callLLM` over the registry's wire formats
 * using Electron's `net.fetch` (Chromium's network stack) so requests respect
 * the system/corporate proxy, PAC scripts, and OS certificates — plain Node
 * `fetch` (undici) ignores those and fails behind corporate proxies. No vendor
 * SDKs. The endpoint (api/baseUrl/model) is resolved by the renderer from the
 * shared provider registry + user config and passed in; this module just speaks
 * the protocol.
 */

export interface LlmCall {
  api: ProviderApi
  baseUrl: string
  model: string
  apiKey: string
  system: string
  user: string
  /** Hint the backend to return strict JSON (used for the organize step). */
  expectJson?: boolean
  maxTokens?: number
  signal?: AbortSignal
}

const env = (k: string, fallback = ''): string => (process.env[k] ?? fallback).trim()

export class ProviderError extends Error {}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** OpenAI-style chat completion — openai, openrouter, zai, groq, ollama, custom… */
async function openAiStyle(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<string> {
  const res = await net.fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal
  })
  const text = await res.text()
  if (!res.ok) throw new ProviderError(humanizeHttp(res.status, text))
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new ProviderError('Provider returned a non-JSON response.')
  }
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new ProviderError('Empty response from provider.')
  return content
}

export async function callLLM(call: LlmCall): Promise<string> {
  const { api, model, system, user, expectJson, apiKey, signal } = call
  const maxTokens = call.maxTokens ?? 1024
  const baseUrl = call.baseUrl.replace(/\/$/, '')
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]

  switch (api) {
    case 'anthropic': {
      const res = await net.fetch(`${baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }]
        }),
        signal
      })
      const text = await res.text()
      if (!res.ok) throw new ProviderError(humanizeHttp(res.status, text))
      const data = JSON.parse(text)
      const out = data?.content?.[0]?.text
      if (typeof out !== 'string') throw new ProviderError('Empty response from Claude.')
      return out
    }

    case 'google': {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`
      const res = await net.fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.2,
            ...(expectJson ? { responseMimeType: 'application/json' } : {})
          }
        }),
        signal
      })
      const text = await res.text()
      if (!res.ok) throw new ProviderError(humanizeHttp(res.status, text))
      const data = JSON.parse(text)
      const out = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof out !== 'string') throw new ProviderError('Empty response from Gemini.')
      return out
    }

    case 'azure': {
      const endpoint = env('CATCH_AZURE_ENDPOINT').replace(/\/$/, '')
      const deployment = env('CATCH_AZURE_DEPLOYMENT')
      const apiVersion = env('CATCH_AZURE_API_VERSION', '2024-06-01')
      if (!endpoint || !deployment)
        throw new ProviderError('Azure endpoint/deployment not configured (see .env.example).')
      return openAiStyle(
        `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
        { 'api-key': apiKey },
        {
          messages,
          temperature: 0.2,
          ...(expectJson ? { response_format: { type: 'json_object' } } : {})
        },
        signal
      )
    }

    case 'openai-compat': {
      if (!baseUrl) throw new ProviderError('No base URL configured for this provider.')
      const headers: Record<string, string> = {}
      if (apiKey) headers.authorization = `Bearer ${apiKey}`
      // OpenRouter uses these (optional) headers for attribution/ranking.
      if (baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'https://github.com/catch-note-helper'
        headers['X-Title'] = 'Catch'
      }
      const isLocal = /127\.0\.0\.1|localhost/.test(baseUrl)
      return openAiStyle(
        `${baseUrl}/chat/completions`,
        headers,
        {
          model,
          messages,
          temperature: 0.2,
          // Local runtimes (Ollama) don't reliably support response_format.
          ...(expectJson && !isLocal ? { response_format: { type: 'json_object' } } : {})
        },
        signal
      )
    }

    default:
      throw new ProviderError(`Unsupported provider api: ${api}`)
  }
}

function humanizeHttp(status: number, body: string): string {
  let detail = ''
  try {
    const j = JSON.parse(body)
    detail = j?.error?.message || j?.message || j?.error || ''
  } catch {
    detail = body.slice(0, 180)
  }
  if (status === 401 || status === 403)
    return `Authentication failed (${status}). Check your API key.`
  if (status === 404) return `Model or endpoint not found (404). ${detail}`.trim()
  if (status === 429) return 'Rate limited (429). Try again in a moment.'
  return `Provider error ${status}. ${detail}`.trim()
}

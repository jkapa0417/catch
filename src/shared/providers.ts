import type { Provider, ProviderApi, ProviderConfig, ResolvedEndpoint } from './types'

/**
 * AI provider registry — the OpenCode-style approach: most providers speak the
 * OpenAI-compatible `/chat/completions` protocol and differ only by base URL +
 * default model, so they share one code path. Anthropic and Google keep their
 * native wire formats. A "custom" provider lets the user point Catch at any
 * OpenAI-compatible endpoint (their own gateway, a self-hosted model, etc).
 *
 * Shared by the renderer (Settings UI + request building) and the main process
 * (the actual HTTP calls), so the two never drift.
 */

export interface ProviderInfo {
  id: string
  label: string
  api: ProviderApi
  /** Fixed base URL for built-in OpenAI-compatible providers. */
  baseUrl?: string
  defaultModel: string
  /** Show a Base URL field in Settings (custom + local providers). */
  configurableBaseUrl?: boolean
  /** No API key required (local Ollama). */
  keyless?: boolean
  /** Key is allowed but not required (custom gateways, local). */
  keyOptional?: boolean
  /** User must supply base URL + model. */
  custom?: boolean
  keyPlaceholder?: string
  /** Where to get an API key. */
  docs?: string
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    api: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-haiku-4-5-20251001',
    keyPlaceholder: 'sk-ant-...',
    docs: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    api: 'openai-compat',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    docs: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    api: 'openai-compat',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    keyPlaceholder: 'sk-or-...',
    docs: 'https://openrouter.ai/keys'
  },
  {
    id: 'google',
    label: 'Google Gemini',
    api: 'google',
    defaultModel: 'gemini-1.5-flash',
    keyPlaceholder: 'AIza...',
    docs: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'zai',
    label: 'Z.ai (GLM)',
    api: 'openai-compat',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    defaultModel: 'glm-4.6',
    keyPlaceholder: 'API key',
    docs: 'https://z.ai/manage-apikey/apikey-list'
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    api: 'openai-compat',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    docs: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'groq',
    label: 'Groq',
    api: 'openai-compat',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    docs: 'https://console.groq.com/keys'
  },
  {
    id: 'mistral',
    label: 'Mistral',
    api: 'openai-compat',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    keyPlaceholder: 'API key',
    docs: 'https://console.mistral.ai/api-keys'
  },
  {
    id: 'xai',
    label: 'xAI Grok',
    api: 'openai-compat',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
    keyPlaceholder: 'xai-...',
    docs: 'https://console.x.ai'
  },
  {
    id: 'together',
    label: 'Together AI',
    api: 'openai-compat',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyPlaceholder: 'API key',
    docs: 'https://api.together.xyz/settings/api-keys'
  },
  {
    id: 'azure',
    label: 'Azure OpenAI',
    api: 'azure',
    defaultModel: '',
    keyPlaceholder: 'API key',
    docs: 'https://learn.microsoft.com/azure/ai-services/openai'
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    api: 'openai-compat',
    baseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: 'llama3.1',
    configurableBaseUrl: true,
    keyless: true,
    keyOptional: true
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    api: 'openai-compat',
    defaultModel: '',
    configurableBaseUrl: true,
    custom: true,
    keyOptional: true,
    keyPlaceholder: 'API key (optional)'
  }
]

export function getProviderInfo(id: Provider): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

export function providerLabel(id: Provider): string {
  return getProviderInfo(id)?.label ?? id
}

/** Effective base URL: user override (where allowed) → registry default. */
export function effectiveBaseUrl(info: ProviderInfo, cfg?: ProviderConfig): string {
  if (info.configurableBaseUrl || info.custom) return (cfg?.baseUrl || info.baseUrl || '').trim()
  return info.baseUrl || ''
}

/** Effective model: user override → registry default. */
export function effectiveModel(info: ProviderInfo, cfg?: ProviderConfig): string {
  return (cfg?.model || info.defaultModel || '').trim()
}

/** Resolve a provider + its config into a concrete endpoint for an AI call. */
export function resolveEndpoint(id: Provider, cfg?: ProviderConfig): ResolvedEndpoint | null {
  const info = getProviderInfo(id)
  if (!info) return null
  return {
    provider: id,
    api: info.api,
    baseUrl: effectiveBaseUrl(info, cfg),
    model: effectiveModel(info, cfg),
    keyOptional: !!(info.keyless || info.keyOptional)
  }
}

/** Is the provider configured enough to call (independent of the API key)? */
export function isConfigured(id: Provider, cfg: ProviderConfig | undefined, hasKey: boolean): boolean {
  const info = getProviderInfo(id)
  if (!info) return false
  if (info.api === 'azure') return hasKey // endpoint/deployment come from env
  const baseUrl = effectiveBaseUrl(info, cfg)
  const model = effectiveModel(info, cfg)
  if (info.api === 'openai-compat' && !baseUrl) return false
  if (!model) return false
  if (info.keyless || info.keyOptional) return true
  return hasKey
}

// Shared domain model + IPC contract for Catch.
// Imported by the main process, the preload bridge, and the renderer so the
// three stay in lockstep.

export type Lang = 'ko' | 'en'

export type Mode = 'meeting' | 'brainstorm' | 'switch' | 'daily'

/** A provider id from the registry (see shared/providers.ts), or 'custom'. */
export type Provider = string

/** Wire protocol used to talk to a provider. */
export type ProviderApi = 'anthropic' | 'google' | 'azure' | 'openai-compat'

/** User-editable per-provider overrides (custom base URL, model selection). */
export interface ProviderConfig {
  baseUrl?: string
  model?: string
}

/** Non-secret export/integration settings (the Notion token is stored encrypted). */
export interface Integrations {
  notionParentPageId?: string
  obsidianVault?: string
}

/** Origin of a captured item: classified by the user, or filed by AI. */
export type ItemSource = 'self' | 'ai'

/**
 * A captured line. `text` is bilingual for the seeded demo content; user- and
 * AI-created items store a plain string (rendered as-is in both languages).
 */
export interface NoteItem {
  id: string
  cat: string
  text: string | { ko: string; en: string }
  owner: string
  by: ItemSource
}

export interface Note {
  id: string
  projectId: string
  mode: Mode
  title: string | { ko: string; en: string }
  date: string
  items: NoteItem[]
}

export interface Project {
  id: string
  name: string | { ko: string; en: string }
}

/** Everything that survives an app restart (sans secrets). */
export interface PersistedState {
  version: number
  projects: Project[]
  notes: Note[]
  activeId: string
  lang: Lang
  provider: Provider
  /** Which providers the user has connected (key saved and/or configured). */
  connectedProviders: Provider[]
  /** Per-provider overrides (base URL, model), keyed by provider id. */
  providerConfig: Record<string, ProviderConfig>
  /** Export/integration settings (Notion page id, Obsidian vault). */
  integrations: Integrations
  collapsed: Record<string, boolean>
  pcount: number
}

// ---- AI backend contracts ----

/** The resolved endpoint the main process should call (registry + user config). */
export interface ResolvedEndpoint {
  provider: Provider
  api: ProviderApi
  baseUrl: string
  model: string
  /** True when no API key is required (local Ollama, optional for custom). */
  keyOptional?: boolean
}

export interface AiOrganizeRequest extends ResolvedEndpoint {
  mode: Mode
  /** Category keys valid for the current mode, e.g. ['decision','action',...] */
  categories: string[]
  rawText: string
  lang: Lang
}

export interface AiOrganizeItem {
  cat: string
  text: string
  owner: string
}

export interface AiEvalRequest extends ResolvedEndpoint {
  mode: Mode
  lang: Lang
  items: { cat: string; text: string; owner: string }[]
}

export interface AiEvalResult {
  good: string
  improve: string
  before: string
  after: string
}

/** Uniform shape for any backend call that can fail with a user-facing reason. */
export interface Result<T> {
  ok: boolean
  data?: T
  error?: string
}

// ---- auto-update ----

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'none'
  | 'progress'
  | 'downloaded'
  | 'error'

export interface UpdateStatus {
  state: UpdateState
  /** Version offered by the update (when available/downloaded). */
  version?: string
  /** Download progress 0–100 (state 'progress'). */
  percent?: number
  /** Human-readable error or note. */
  message?: string
}

export interface ExportPayload {
  /** Suggested file name without extension, e.g. "Q3-roadmap-2026-06-17". */
  filename: string
  /** Rendered markdown body. */
  markdown: string
  /** Plain title for Obsidian/Notion. */
  title: string
}

export interface ExportResult {
  ok: boolean
  /** Saved file path or external URL, when applicable. */
  target?: string
  /** True when the user cancelled a save dialog (not an error). */
  cancelled?: boolean
  error?: string
}

/** The surface exposed to the renderer via contextBridge (`window.catch`). */
export interface CatchApi {
  loadState(): Promise<PersistedState | null>
  saveState(state: PersistedState): Promise<void>

  hasApiKey(provider: Provider): Promise<boolean>
  setApiKey(provider: Provider, key: string): Promise<Result<true>>
  /** Provider-config readiness (key present where required, endpoint set, etc.). */
  providerReady(provider: Provider): Promise<boolean>
  /** Actually call the provider with a tiny request to confirm it works. */
  verifyProvider(req: ResolvedEndpoint): Promise<Result<true>>

  aiOrganize(req: AiOrganizeRequest): Promise<Result<AiOrganizeItem[]>>
  aiEval(req: AiEvalRequest): Promise<Result<AiEvalResult>>

  exportMarkdown(payload: ExportPayload): Promise<ExportResult>
  copyText(text: string): Promise<void>
  openObsidian(payload: ExportPayload): Promise<ExportResult>
  exportNotion(payload: ExportPayload): Promise<ExportResult>

  /** Native window controls (the design's traffic-light buttons). */
  winMinimize(): Promise<void>
  winToggleMaximize(): Promise<void>
  winClose(): Promise<void>
  /** Host platform, so the renderer can order/space the window controls. */
  platform: NodeJS.Platform

  /** This app's version (from package.json). */
  getAppVersion(): Promise<string>
  /** Manually check GitHub Releases for a newer version. */
  checkForUpdates(): Promise<void>
  /** Download the available update (progress arrives via onUpdateStatus). */
  downloadUpdate(): Promise<void>
  /** Quit and install the downloaded update. */
  installUpdate(): Promise<void>
  /** Subscribe to update lifecycle events; returns an unsubscribe function. */
  onUpdateStatus(cb: (status: UpdateStatus) => void): () => void
}

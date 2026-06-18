import { app, safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { PersistedState, Provider } from '@shared/types'

/**
 * On-disk persistence for Catch.
 *
 * - `state.json`   — the full app state (projects, notes, prefs). No secrets.
 * - `secrets.json` — per-provider API keys, each encrypted with the OS keychain
 *   via Electron's safeStorage. Never written in plaintext when encryption is
 *   available; falls back to an obfuscated marker only on platforms without it.
 */

const dir = () => app.getPath('userData')
const statePath = () => join(dir(), 'state.json')
const secretsPath = () => join(dir(), 'secrets.json')

function ensureDir(): void {
  const d = dir()
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

/** Atomic write: write to a temp file then rename, so a crash never truncates. */
function writeAtomic(file: string, contents: string): void {
  ensureDir()
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, contents, 'utf8')
  renameSync(tmp, file)
}

export function loadState(): PersistedState | null {
  try {
    const p = statePath()
    if (!existsSync(p)) return null
    const parsed = JSON.parse(readFileSync(p, 'utf8')) as PersistedState
    if (!parsed || !Array.isArray(parsed.notes)) return null
    return parsed
  } catch (err) {
    console.error('[store] failed to read state:', err)
    return null
  }
}

export function saveState(state: PersistedState): void {
  try {
    writeAtomic(statePath(), JSON.stringify(state, null, 2))
  } catch (err) {
    console.error('[store] failed to write state:', err)
  }
}

// ---- secrets ----

type SecretMap = Record<string, { enc: boolean; v: string }>

function readSecrets(): SecretMap {
  try {
    const p = secretsPath()
    if (!existsSync(p)) return {}
    return JSON.parse(readFileSync(p, 'utf8')) as SecretMap
  } catch {
    return {}
  }
}

function writeSecrets(map: SecretMap): void {
  writeAtomic(secretsPath(), JSON.stringify(map))
}

export function setApiKey(provider: Provider, key: string): void {
  const map = readSecrets()
  const trimmed = key.trim()
  if (!trimmed) {
    delete map[provider]
    writeSecrets(map)
    return
  }
  if (safeStorage.isEncryptionAvailable()) {
    map[provider] = { enc: true, v: safeStorage.encryptString(trimmed).toString('base64') }
  } else {
    // No OS keychain (e.g. some Linux setups without a secret service).
    // Store base64 so it is at least not casually readable; documented in README.
    map[provider] = { enc: false, v: Buffer.from(trimmed, 'utf8').toString('base64') }
  }
  writeSecrets(map)
}

export function getApiKey(provider: Provider): string {
  const entry = readSecrets()[provider]
  if (!entry) return ''
  try {
    if (entry.enc) {
      if (!safeStorage.isEncryptionAvailable()) return ''
      return safeStorage.decryptString(Buffer.from(entry.v, 'base64'))
    }
    return Buffer.from(entry.v, 'base64').toString('utf8')
  } catch (err) {
    console.error('[store] failed to decrypt key:', err)
    return ''
  }
}

/** True only when a key is stored AND can be decrypted on this machine. */
export function hasApiKey(provider: Provider): boolean {
  return getApiKey(provider).length > 0
}

/** True when a key entry exists, even if it can't be decrypted here. */
export function hasStoredEntry(provider: Provider): boolean {
  return !!readSecrets()[provider]
}

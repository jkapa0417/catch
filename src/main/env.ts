import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Minimal .env loader (no dotenv dependency). Reads KEY=VALUE pairs from a
 * .env file next to the app and merges them into process.env without
 * overwriting anything already set in the real environment.
 */
export function loadDotenv(...dirs: string[]): void {
  for (const dir of dirs) {
    const file = join(dir, '.env')
    if (!existsSync(file)) continue
    try {
      for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const eq = line.indexOf('=')
        if (eq < 0) continue
        const key = line.slice(0, eq).trim()
        let val = line.slice(eq + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        if (key && process.env[key] === undefined) process.env[key] = val
      }
    } catch {
      // best-effort; ignore malformed .env
    }
  }
}

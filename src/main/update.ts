import { app, BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import { IPC } from '@shared/ipc'
import type { UpdateStatus } from '@shared/types'

/**
 * Auto-update via electron-updater, wired to the GitHub Releases the CI
 * publishes (the `publish` block in electron-builder.yml). The app checks on
 * launch and lets the user download + install from within the UI.
 *
 * Caveats:
 * - Only works in a packaged build (`app.isPackaged`); in dev we no-op.
 * - macOS auto-install requires a code-signed app; unsigned mac builds can be
 *   detected but not installed in place (Windows NSIS + Linux AppImage are fine).
 */

const { autoUpdater } = electronUpdater

let wired = false

function broadcast(status: UpdateStatus): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.updateStatus, status)
  }
}

export function initAutoUpdater(): void {
  if (wired) return
  wired = true

  autoUpdater.autoDownload = false // ask the user before downloading
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('checking-for-update', () => broadcast({ state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    broadcast({ state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => broadcast({ state: 'none' }))
  autoUpdater.on('download-progress', (p) =>
    broadcast({ state: 'progress', percent: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    broadcast({ state: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (err) =>
    broadcast({ state: 'error', message: err == null ? 'Unknown error' : (err.message ?? String(err)) })
  )

  if (app.isPackaged) {
    // Give the window a moment to mount its listener before the first check.
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {
        /* surfaced via the 'error' event */
      })
    }, 3000)
  }
}

export async function checkForUpdates(): Promise<void> {
  if (!app.isPackaged) {
    broadcast({ state: 'none', message: 'Updates are only available in an installed build.' })
    return
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    broadcast({ state: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export async function downloadUpdate(): Promise<void> {
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    broadcast({ state: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export function installUpdate(): void {
  // Defer so the IPC reply is flushed before the app quits.
  setImmediate(() => autoUpdater.quitAndInstall())
}

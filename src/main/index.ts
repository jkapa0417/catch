import { app, shell, BrowserWindow, ipcMain, safeStorage } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { IPC } from '@shared/ipc'
import type {
  AiEvalRequest,
  AiOrganizeRequest,
  ExportPayload,
  PersistedState,
  Provider,
  ResolvedEndpoint
} from '@shared/types'
import { isConfigured } from '@shared/providers'
import { loadDotenv } from './env'
import * as store from './store'
import { aiEval, aiOrganize, verifyProvider } from './ai'
import { copyText, exportMarkdown, exportNotion, openObsidian } from './exports'
import { checkForUpdates, downloadUpdate, initAutoUpdater, installUpdate } from './update'

loadDotenv(app.getAppPath(), process.cwd())

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    title: 'Catch',
    backgroundColor: '#ECEFEE',
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (process.env.CATCH_SMOKE === '1') runSmokeProbe(mainWindow!)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Headless self-check (CATCH_SMOKE=1): confirms the preload bridge is exposed
 * and the renderer actually mounted, writes a PNG capture, then exits. Used in
 * CI / environments without an attached display.
 */
async function runSmokeProbe(win: BrowserWindow): Promise<void> {
  const wc = win.webContents
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const readBorder = () =>
    wc.executeJavaScript(
      `(() => { const el = document.querySelector('[data-testid="captured-item"]'); return el ? getComputedStyle(el).borderTopColor : null; })()`
    )
  try {
    await sleep(1500)
    const report = await wc.executeJavaScript(`(() => ({
      hasBridge: typeof window.catch === 'object' && window.catch !== null,
      rootChildren: document.getElementById('root')?.children.length ?? 0,
      titlebar: document.body.innerText.includes('캐치') || document.body.innerText.includes('Catch'),
      buttons: document.querySelectorAll('button').length
    }))()`)
    console.log('[smoke]', JSON.stringify(report))

    // Real OS-level hover round-trip on a captured item, to confirm the border
    // reverts cleanly (regression guard for the shorthand/longhand hover bug).
    const rect = await wc.executeJavaScript(
      `(() => { const el = document.querySelector('[data-testid="captured-item"]'); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`
    )
    if (rect) {
      const initial = await readBorder()
      wc.sendInputEvent({ type: 'mouseMove', x: Math.round(rect.x), y: Math.round(rect.y) })
      await sleep(120)
      const hovered = await readBorder()
      wc.sendInputEvent({ type: 'mouseMove', x: 5, y: 5 })
      await sleep(120)
      const afterLeave = await readBorder()
      console.log(
        '[smoke] hoverCheck',
        JSON.stringify({
          initial,
          hovered,
          afterLeave,
          hoverApplied: hovered !== initial,
          revertsClean: afterLeave === initial
        })
      )
    }

    // Empty-start + context-menu checks.
    const emptyState = await wc.executeJavaScript(`(() => ({
      capturedItems: document.querySelectorAll('[data-testid="captured-item"]').length,
      noteItems: document.querySelectorAll('[data-testid="note-item"]').length,
      projectHeaders: document.querySelectorAll('[data-testid="project-header"]').length,
      lang: document.documentElement.lang
    }))()`)
    console.log('[smoke] emptyState', JSON.stringify(emptyState))

    const menuCheck = await wc.executeJavaScript(`(() => new Promise((resolve) => {
      const ph = document.querySelector('[data-testid="project-header"]');
      if (!ph) return resolve({ opened: false });
      ph.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 120, clientY: 160 }));
      setTimeout(() => {
        const labels = Array.from(document.querySelectorAll('button span'))
          .map((s) => s.textContent)
          .filter(Boolean);
        resolve({
          opened: labels.includes('Rename') && labels.includes('Delete project')
        });
      }, 150);
    }))()`)
    console.log('[smoke] menuCheck', JSON.stringify(menuCheck))

    const typePicker = await wc.executeJavaScript(`(() => new Promise((resolve) => {
      const btn = document.querySelector('[data-testid="new-note-btn"]');
      if (!btn) return resolve({ opened: false });
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      setTimeout(() => {
        const labels = Array.from(document.querySelectorAll('button span, div'))
          .map((s) => s.textContent)
          .filter(Boolean);
        resolve({
          opened:
            labels.includes('Choose a note type') &&
            labels.includes('Meeting') &&
            labels.includes('Brainstorm')
        });
      }, 150);
    }))()`)
    console.log('[smoke] typePicker', JSON.stringify(typePicker))

    const providers = await wc.executeJavaScript(`(() => new Promise((resolve) => {
      document.querySelector('[data-testid="settings-btn"]').click();
      setTimeout(() => {
        const sel = document.querySelector('[data-testid="provider-select"]');
        const opts = sel ? Array.from(sel.options).map((o) => o.textContent) : [];
        resolve({
          count: opts.length,
          hasOpenRouter: opts.includes('OpenRouter'),
          hasZai: opts.includes('Z.ai (GLM)'),
          hasCustom: opts.includes('Custom (OpenAI-compatible)')
        });
      }, 200);
    }))()`)
    console.log('[smoke] providers', JSON.stringify(providers))

    const customFields = await wc.executeJavaScript(`(() => new Promise((resolve) => {
      const sel = document.querySelector('[data-testid="provider-select"]');
      if (!sel) return resolve({ baseUrlField: false });
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'custom');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      setTimeout(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        resolve({
          baseUrlField: inputs.some((i) => (i.placeholder || '').includes('https://'))
        });
      }, 200);
    }))()`)
    console.log('[smoke] customFields', JSON.stringify(customFields))

    const integrations = await wc.executeJavaScript(`(() => {
      const text = document.body.innerText;
      const inputs = Array.from(document.querySelectorAll('input'));
      return {
        hasNotion: text.includes('Notion'),
        hasObsidian: text.includes('Obsidian'),
        hasParentField: inputs.some((i) => (i.placeholder || '').includes('page ID')),
        hasVaultField: inputs.some((i) => (i.placeholder || '').toLowerCase().includes('vault'))
      };
    })()`)
    console.log('[smoke] integrations', JSON.stringify(integrations))

    // Regression check: the encrypted secret store must round-trip a key, and
    // hasApiKey must reflect decryptability (drives the "connected" badge).
    try {
      store.setApiKey('__diag__', 'sk-roundtrip-123')
      const roundTrip = store.getApiKey('__diag__')
      console.log(
        '[smoke] secretStore',
        JSON.stringify({
          encAvailable: safeStorage.isEncryptionAvailable(),
          match: roundTrip === 'sk-roundtrip-123',
          hasApiKey: store.hasApiKey('__diag__')
        })
      )
      store.setApiKey('__diag__', '') // clean up
    } catch (e) {
      console.log('[smoke] secretStore error', String(e))
    }
    const img = await win.webContents.capturePage()
    const out = join(process.cwd(), 'smoke-capture.png')
    writeFileSync(out, img.toPNG())
    console.log('[smoke] capture ->', out)
  } catch (err) {
    console.error('[smoke] failed:', err)
  } finally {
    app.quit()
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.loadState, () => store.loadState())
  ipcMain.handle(IPC.saveState, (_e, state: PersistedState) => store.saveState(state))

  ipcMain.handle(IPC.hasApiKey, (_e, provider: Provider) => store.hasApiKey(provider))
  ipcMain.handle(IPC.setApiKey, (_e, provider: Provider, key: string) => {
    try {
      store.setApiKey(provider, key)
      return { ok: true, data: true as const }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to save key.' }
    }
  })
  ipcMain.handle(IPC.providerReady, (_e, provider: Provider) => {
    const cfg = store.loadState()?.providerConfig?.[provider]
    return isConfigured(provider, cfg, store.hasApiKey(provider))
  })

  ipcMain.handle(IPC.verifyProvider, (_e, req: ResolvedEndpoint) => verifyProvider(req))
  ipcMain.handle(IPC.aiOrganize, (_e, req: AiOrganizeRequest) => aiOrganize(req))
  ipcMain.handle(IPC.aiEval, (_e, req: AiEvalRequest) => aiEval(req))

  ipcMain.handle(IPC.exportMarkdown, (e, payload: ExportPayload) =>
    exportMarkdown(BrowserWindow.fromWebContents(e.sender), payload)
  )
  ipcMain.handle(IPC.copyText, (_e, text: string) => copyText(text))
  ipcMain.handle(IPC.openObsidian, (_e, payload: ExportPayload) => {
    const vault =
      store.loadState()?.integrations?.obsidianVault?.trim() ||
      (process.env.CATCH_OBSIDIAN_VAULT ?? '').trim()
    return openObsidian(payload, { vault })
  })
  ipcMain.handle(IPC.exportNotion, (_e, payload: ExportPayload) => {
    const token = store.getApiKey('notion') || (process.env.CATCH_NOTION_TOKEN ?? '').trim()
    const parentId =
      store.loadState()?.integrations?.notionParentPageId?.trim() ||
      (process.env.CATCH_NOTION_PARENT_PAGE_ID ?? '').trim()
    return exportNotion(payload, { token, parentId })
  })

  ipcMain.handle(IPC.winMinimize, (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.handle(IPC.winToggleMaximize, (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (!w) return
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
  })
  ipcMain.handle(IPC.winClose, (e) => BrowserWindow.fromWebContents(e.sender)?.close())

  ipcMain.handle(IPC.getAppVersion, () => app.getVersion())
  ipcMain.handle(IPC.updateCheck, () => checkForUpdates())
  ipcMain.handle(IPC.updateDownload, () => downloadUpdate())
  ipcMain.handle(IPC.updateInstall, () => installUpdate())
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.catch.notehelper')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerIpc()
  createWindow()
  initAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

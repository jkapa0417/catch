import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc'
import type {
  AiEvalRequest,
  AiOrganizeRequest,
  CatchApi,
  ExportPayload,
  PersistedState,
  Provider,
  ResolvedEndpoint,
  UpdateStatus
} from '@shared/types'

const api: CatchApi = {
  loadState: () => ipcRenderer.invoke(IPC.loadState),
  saveState: (state: PersistedState) => ipcRenderer.invoke(IPC.saveState, state),

  hasApiKey: (provider: Provider) => ipcRenderer.invoke(IPC.hasApiKey, provider),
  setApiKey: (provider: Provider, key: string) => ipcRenderer.invoke(IPC.setApiKey, provider, key),
  providerReady: (provider: Provider) => ipcRenderer.invoke(IPC.providerReady, provider),
  verifyProvider: (req: ResolvedEndpoint) => ipcRenderer.invoke(IPC.verifyProvider, req),

  aiOrganize: (req: AiOrganizeRequest) => ipcRenderer.invoke(IPC.aiOrganize, req),
  aiEval: (req: AiEvalRequest) => ipcRenderer.invoke(IPC.aiEval, req),

  exportMarkdown: (payload: ExportPayload) => ipcRenderer.invoke(IPC.exportMarkdown, payload),
  copyText: (text: string) => ipcRenderer.invoke(IPC.copyText, text),
  openObsidian: (payload: ExportPayload) => ipcRenderer.invoke(IPC.openObsidian, payload),
  exportNotion: (payload: ExportPayload) => ipcRenderer.invoke(IPC.exportNotion, payload),

  winMinimize: () => ipcRenderer.invoke(IPC.winMinimize),
  winToggleMaximize: () => ipcRenderer.invoke(IPC.winToggleMaximize),
  winClose: () => ipcRenderer.invoke(IPC.winClose),
  platform: process.platform,

  getAppVersion: () => ipcRenderer.invoke(IPC.getAppVersion),
  checkForUpdates: () => ipcRenderer.invoke(IPC.updateCheck),
  downloadUpdate: () => ipcRenderer.invoke(IPC.updateDownload),
  installUpdate: () => ipcRenderer.invoke(IPC.updateInstall),
  onUpdateStatus: (cb: (status: UpdateStatus) => void) => {
    const listener = (_e: unknown, status: UpdateStatus) => cb(status)
    ipcRenderer.on(IPC.updateStatus, listener)
    return () => ipcRenderer.removeListener(IPC.updateStatus, listener)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('catch', api)
} else {
  // @ts-expect-error — fallback for non-isolated contexts (not used in production)
  window.catch = api
}

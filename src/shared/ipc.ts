// Canonical IPC channel names, shared by main + preload so they never drift.
export const IPC = {
  loadState: 'catch:load-state',
  saveState: 'catch:save-state',
  hasApiKey: 'catch:has-api-key',
  setApiKey: 'catch:set-api-key',
  providerReady: 'catch:provider-ready',
  verifyProvider: 'catch:verify-provider',
  aiOrganize: 'catch:ai-organize',
  aiEval: 'catch:ai-eval',
  exportMarkdown: 'catch:export-markdown',
  copyText: 'catch:copy-text',
  openObsidian: 'catch:open-obsidian',
  exportNotion: 'catch:export-notion',
  winMinimize: 'catch:win-minimize',
  winToggleMaximize: 'catch:win-toggle-maximize',
  winClose: 'catch:win-close'
} as const

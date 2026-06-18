import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AiEvalResult,
  Lang,
  Mode,
  Note,
  PersistedState,
  Project,
  Provider
} from '@shared/types'
import {
  PROVIDERS,
  effectiveBaseUrl,
  effectiveModel,
  getProviderInfo,
  isConfigured,
  providerLabel,
  resolveEndpoint
} from '@shared/providers'
import type { Integrations, ProviderConfig, UpdateStatus } from '@shared/types'
import { CATLABEL, HUE, MODES } from '../lib/constants'
import { L } from '../lib/i18n'
import { itxt, ntitle, ownerDisp, parseOwner, pname, rid } from '../lib/notes'
import { barColor, scoreNote } from '../lib/scoring'
import { captureStreak, weekScoreDelta } from '../lib/stats'
import { emptyNote, initialState } from '../lib/initialData'
import { buildExport } from '../lib/markdown'
import type { MenuState } from '../components/ContextMenu'

const STATE_VERSION = 1

interface AppState {
  projects: Project[]
  notes: Note[]
  activeId: string
  draft: string
  staged: string | null
  aiInput: string
  aiLoading: boolean
  aiStatus: string
  aiErr: boolean
  evalLoading: boolean
  evalStatus: string
  evalDone: boolean
  evalResult: AiEvalResult | null
  toast: string | null
  collapsed: Record<string, boolean>
  lang: Lang
  settingsOpen: boolean
  provider: Provider
  apiKey: string
  verifying: boolean
  connectedProviders: Provider[]
  providerConfig: Record<string, ProviderConfig>
  integrations: Integrations
  notionToken: string
  notionConnected: boolean
  appVersion: string
  update: UpdateStatus
  pcount: number
  loaded: boolean
  menu: MenuState | null
  editingProjectId: string | null
  editingNoteId: string | null
}

function freshState(): AppState {
  const init = initialState()
  return {
    projects: init.projects,
    notes: init.notes,
    activeId: init.activeId,
    draft: '',
    staged: null,
    aiInput: '',
    aiLoading: false,
    aiStatus: '',
    aiErr: false,
    evalLoading: false,
    evalStatus: '',
    evalDone: false,
    evalResult: null,
    toast: null,
    collapsed: {},
    lang: 'en',
    settingsOpen: false,
    provider: 'anthropic',
    apiKey: '',
    verifying: false,
    connectedProviders: [],
    providerConfig: {},
    integrations: {},
    notionToken: '',
    notionConnected: false,
    appVersion: '',
    update: { state: 'idle' },
    pcount: 0,
    loaded: false,
    menu: null,
    editingProjectId: null,
    editingNoteId: null
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useApp() {
  const [s, setS] = useState<AppState>(freshState)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // ---- load persisted state on mount ----
  useEffect(() => {
    let alive = true
    ;(async () => {
      const persisted = await window.catch.loadState()
      const notionConnected = await window.catch.hasApiKey('notion')
      // Reconcile the "connected" list with reality: a key-required provider only
      // counts as connected if its key is actually present and decryptable now.
      let connectedProviders: string[] = []
      if (persisted) {
        const candidates = (persisted.connectedProviders ?? []).filter((p) => getProviderInfo(p))
        const checks = await Promise.all(
          candidates.map(async (p) => {
            const info = getProviderInfo(p)!
            const ok = info.keyless || info.keyOptional ? true : await window.catch.hasApiKey(p)
            return ok ? p : null
          })
        )
        connectedProviders = checks.filter((p): p is string => !!p)
      }
      if (!alive) return
      if (persisted) {
        setS((prev) => ({
          ...prev,
          projects: persisted.projects,
          notes: persisted.notes,
          activeId: persisted.notes.some((n) => n.id === persisted.activeId)
            ? persisted.activeId
            : persisted.notes[0]?.id ?? prev.activeId,
          lang: persisted.lang,
          // Migrate away from provider ids that no longer exist in the registry.
          provider: getProviderInfo(persisted.provider) ? persisted.provider : 'anthropic',
          connectedProviders,
          providerConfig: persisted.providerConfig ?? {},
          integrations: persisted.integrations ?? {},
          collapsed: persisted.collapsed ?? {},
          pcount: persisted.pcount ?? 0,
          notionConnected,
          loaded: true
        }))
      } else {
        setS((prev) => ({ ...prev, notionConnected, loaded: true }))
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // ---- auto-update: read version + subscribe to update lifecycle ----
  useEffect(() => {
    let alive = true
    window.catch.getAppVersion().then((v) => {
      if (alive) setS((p) => ({ ...p, appVersion: v }))
    })
    const off = window.catch.onUpdateStatus((status) => setS((p) => ({ ...p, update: status })))
    return () => {
      alive = false
      off()
    }
  }, [])

  // ---- debounced persistence of the durable slice ----
  useEffect(() => {
    if (!s.loaded) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const snapshot: PersistedState = {
        version: STATE_VERSION,
        projects: s.projects,
        notes: s.notes,
        activeId: s.activeId,
        lang: s.lang,
        provider: s.provider,
        connectedProviders: s.connectedProviders,
        providerConfig: s.providerConfig,
        integrations: s.integrations,
        collapsed: s.collapsed,
        pcount: s.pcount
      }
      window.catch.saveState(snapshot)
    }, 350)
    return () => clearTimeout(saveTimer.current)
  }, [
    s.loaded,
    s.projects,
    s.notes,
    s.activeId,
    s.lang,
    s.provider,
    s.connectedProviders,
    s.providerConfig,
    s.integrations,
    s.collapsed,
    s.pcount
  ])

  // Keep the connected badge truthful: verify the current key-required provider
  // actually has a usable key whenever Settings opens or the provider changes.
  useEffect(() => {
    if (!s.loaded) return
    const provider = s.provider
    const info = getProviderInfo(provider)
    if (!info || info.keyless || info.keyOptional) return
    let alive = true
    window.catch.hasApiKey(provider).then((present) => {
      if (!alive) return
      setS((prev) => {
        if (prev.provider !== provider) return prev
        const has = prev.connectedProviders.includes(provider)
        if (present === has) return prev
        return {
          ...prev,
          connectedProviders: present
            ? [...prev.connectedProviders, provider]
            : prev.connectedProviders.filter((p) => p !== provider)
        }
      })
    })
    return () => {
      alive = false
    }
  }, [s.provider, s.settingsOpen, s.loaded])

  // ---- helpers ----
  const T = L[s.lang]
  const active = useMemo<Note>(
    () => s.notes.find((n) => n.id === s.activeId) || s.notes[0],
    [s.notes, s.activeId]
  )
  const cats = useCallback((mode: Mode) => MODES[mode].cats, [])
  const catLabel = useCallback((k: string) => (CATLABEL[k] ? CATLABEL[k][s.lang] : k), [s.lang])
  const catHue = useCallback(
    (mode: Mode, k: string) => {
      const c = cats(mode).find((x) => x.k === k)
      return HUE[c ? c.h : 'slate']
    },
    [cats]
  )

  const showToast = useCallback((msg: string) => {
    setS((prev) => ({ ...prev, toast: msg }))
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setS((prev) => ({ ...prev, toast: null })), 1900)
  }, [])

  // ---- mutations ----
  const fileItem = useCallback((cat: string, raw: string, by: 'self' | 'ai' = 'self') => {
    const t = (raw || '').trim()
    if (!t) return
    const { text, owner } = parseOwner(t)
    if (!text) return
    setS((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === prev.activeId
          ? { ...n, items: [...n.items, { id: rid(), cat, text, owner, by }] }
          : n
      ),
      staged: null,
      draft: ''
    }))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setS((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === prev.activeId ? { ...n, items: n.items.filter((i) => i.id !== itemId) } : n
      )
    }))
  }, [])

  const classify = useCallback(
    (cat: string) => {
      if (s.staged !== null) fileItem(cat, s.staged, 'self')
      else if (s.draft.trim()) fileItem(cat, s.draft, 'self')
    },
    [s.staged, s.draft, fileItem]
  )

  const patchActive = useCallback((patch: Partial<Note>) => {
    setS((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === prev.activeId ? { ...n, ...patch } : n))
    }))
  }, [])

  const newNote = useCallback((mode: Mode) => {
    setS((prev) => {
      const proj = (prev.notes.find((n) => n.id === prev.activeId) || prev.notes[0]).projectId
      const id = 'x' + rid()
      const note: Note = { id, projectId: proj, mode, title: '', date: today(), items: [] }
      return {
        ...prev,
        notes: [note, ...prev.notes],
        activeId: id,
        menu: null,
        staged: null,
        draft: '',
        evalDone: false,
        evalResult: null
      }
    })
  }, [])

  const newProject = useCallback(() => {
    setS((prev) => {
      const pid = 'px' + rid()
      const nid = 'x' + rid()
      const num = prev.pcount + 1
      const proj: Project = {
        id: pid,
        name: { ko: `${L.ko.newProjectName} ${num}`, en: `${L.en.newProjectName} ${num}` }
      }
      const note: Note = { id: nid, projectId: pid, mode: 'meeting', title: '', date: today(), items: [] }
      return {
        ...prev,
        projects: [...prev.projects, proj],
        notes: [note, ...prev.notes],
        activeId: nid,
        pcount: num,
        staged: null,
        draft: '',
        evalDone: false,
        evalResult: null
      }
    })
  }, [])

  const deleteNote = useCallback(() => {
    setS((prev) => {
      if (prev.notes.length <= 1) {
        showToast(L[prev.lang].tLastNote)
        return prev
      }
      const rest = prev.notes.filter((n) => n.id !== prev.activeId)
      showToast(L[prev.lang].tDel)
      return { ...prev, notes: rest, activeId: rest[0].id, evalDone: false, evalResult: null }
    })
  }, [showToast])

  const toggleProject = useCallback((pid: string) => {
    setS((prev) => ({ ...prev, collapsed: { ...prev.collapsed, [pid]: !prev.collapsed[pid] } }))
  }, [])

  const selectNote = useCallback((id: string) => {
    setS((prev) => ({ ...prev, activeId: id, staged: null, draft: '', evalDone: false, evalResult: null }))
  }, [])

  // ---- context menu + inline rename ----
  const closeMenu = useCallback(() => setS((prev) => ({ ...prev, menu: null })), [])

  const startProjectRename = useCallback((id: string) => {
    setS((prev) => ({ ...prev, editingProjectId: id, editingNoteId: null, menu: null }))
  }, [])
  const startNoteRename = useCallback((id: string) => {
    setS((prev) => ({ ...prev, editingNoteId: id, editingProjectId: null, menu: null }))
  }, [])
  const cancelRename = useCallback(() => {
    setS((prev) => ({ ...prev, editingProjectId: null, editingNoteId: null }))
  }, [])

  const commitProjectRename = useCallback((id: string, value: string) => {
    const name = value.trim()
    setS((prev) => ({
      ...prev,
      editingProjectId: null,
      projects: name ? prev.projects.map((p) => (p.id === id ? { ...p, name } : p)) : prev.projects
    }))
  }, [])
  const commitNoteRename = useCallback((id: string, value: string) => {
    const title = value.trim()
    setS((prev) => ({
      ...prev,
      editingNoteId: null,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, title } : n))
    }))
  }, [])

  // ---- project management ----
  const moveProject = useCallback((id: string, dir: -1 | 1) => {
    setS((prev) => {
      const idx = prev.projects.findIndex((p) => p.id === id)
      const j = idx + dir
      if (idx < 0 || j < 0 || j >= prev.projects.length) return { ...prev, menu: null }
      const projects = [...prev.projects]
      const [moved] = projects.splice(idx, 1)
      projects.splice(j, 0, moved)
      return { ...prev, projects, menu: null }
    })
  }, [])

  const newNoteInProject = useCallback((projectId: string, mode: Mode) => {
    setS((prev) => {
      const note = { ...emptyNote(projectId), mode }
      return {
        ...prev,
        notes: [note, ...prev.notes],
        activeId: note.id,
        collapsed: { ...prev.collapsed, [projectId]: false },
        menu: null,
        staged: null,
        draft: '',
        evalDone: false,
        evalResult: null
      }
    })
  }, [])

  const deleteProject = useCallback(
    (id: string) => {
      setS((prev) => {
        let projects = prev.projects.filter((p) => p.id !== id)
        let notes = prev.notes.filter((n) => n.projectId !== id)
        // Preserve the invariant: at least one project and one note must remain.
        if (projects.length === 0) {
          const init = initialState()
          projects = init.projects
          notes = init.notes
        } else if (notes.length === 0) {
          notes = [emptyNote(projects[0].id)]
        }
        const activeId = notes.some((n) => n.id === prev.activeId) ? prev.activeId : notes[0].id
        showToast(L[prev.lang].tProjDel)
        return { ...prev, projects, notes, activeId, menu: null, editingProjectId: null }
      })
    },
    [showToast]
  )

  // ---- note management ----
  const deleteNoteById = useCallback(
    (id: string) => {
      setS((prev) => {
        if (prev.notes.length <= 1) {
          showToast(L[prev.lang].tLastNote)
          return { ...prev, menu: null }
        }
        const rest = prev.notes.filter((n) => n.id !== id)
        const wasActive = prev.activeId === id
        showToast(L[prev.lang].tDel)
        return {
          ...prev,
          notes: rest,
          activeId: wasActive ? rest[0].id : prev.activeId,
          menu: null,
          editingNoteId: null,
          evalDone: wasActive ? false : prev.evalDone,
          evalResult: wasActive ? null : prev.evalResult
        }
      })
    },
    [showToast]
  )

  const duplicateNote = useCallback(
    (id: string) => {
      setS((prev) => {
        const idx = prev.notes.findIndex((n) => n.id === id)
        if (idx < 0) return { ...prev, menu: null }
        const src = prev.notes[idx]
        const copy: Note = {
          ...src,
          id: 'x' + rid(),
          items: src.items.map((i) => ({ ...i, id: rid() }))
        }
        const notes = [...prev.notes]
        notes.splice(idx + 1, 0, copy)
        showToast(L[prev.lang].tNoteDup)
        return { ...prev, notes, activeId: copy.id, menu: null }
      })
    },
    [showToast]
  )

  const moveNoteToProject = useCallback(
    (id: string, projectId: string) => {
      setS((prev) => {
        showToast(L[prev.lang].tNoteMoved)
        return {
          ...prev,
          notes: prev.notes.map((n) => (n.id === id ? { ...n, projectId } : n)),
          collapsed: { ...prev.collapsed, [projectId]: false },
          menu: null
        }
      })
    },
    [showToast]
  )

  // Note-type picker shared by the "+ New note" button and project menus.
  const modePickItems = useCallback(
    (onPick: (m: Mode) => void) =>
      (Object.keys(MODES) as Mode[]).map((m) => ({
        label: L[s.lang].modeLabel[m],
        dot: MODES[m].accent,
        onClick: () => onPick(m)
      })),
    [s.lang]
  )

  const openNewNoteMenu = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const items = [
        { header: true, label: L[s.lang].ctx.chooseType },
        ...modePickItems((m) => newNote(m))
      ]
      setS((prev) => ({ ...prev, menu: { x: rect.left, y: rect.bottom + 4, items } }))
    },
    [s.lang, modePickItems, newNote]
  )

  const openProjectMenu = useCallback(
    (e: React.MouseEvent, projectId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const T2 = L[s.lang]
      const idx = s.projects.findIndex((p) => p.id === projectId)
      const items = [
        { label: T2.ctx.rename, onClick: () => startProjectRename(projectId) },
        { label: T2.ctx.newNote, submenu: modePickItems((m) => newNoteInProject(projectId, m)) },
        { separator: true },
        { label: T2.ctx.moveUp, onClick: () => moveProject(projectId, -1), disabled: idx <= 0 },
        {
          label: T2.ctx.moveDown,
          onClick: () => moveProject(projectId, 1),
          disabled: idx >= s.projects.length - 1
        },
        { separator: true },
        { label: T2.ctx.deleteProject, danger: true, onClick: () => deleteProject(projectId) }
      ]
      setS((prev) => ({ ...prev, menu: { x: e.clientX, y: e.clientY, items } }))
    },
    [s.lang, s.projects, startProjectRename, newNoteInProject, modePickItems, moveProject, deleteProject]
  )

  const openNoteMenu = useCallback(
    (e: React.MouseEvent, noteId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const T2 = L[s.lang]
      const note = s.notes.find((n) => n.id === noteId)
      const others = s.projects.filter((p) => p.id !== note?.projectId)
      const items = [
        { label: T2.ctx.rename, onClick: () => startNoteRename(noteId) },
        { label: T2.ctx.duplicate, onClick: () => duplicateNote(noteId) },
        {
          label: T2.ctx.moveTo,
          disabled: others.length === 0,
          submenu: others.map((p) => ({
            label: pname(p, s.lang),
            onClick: () => moveNoteToProject(noteId, p.id)
          }))
        },
        { separator: true },
        {
          label: T2.ctx.del,
          danger: true,
          disabled: s.notes.length <= 1,
          onClick: () => deleteNoteById(noteId)
        }
      ]
      setS((prev) => ({ ...prev, menu: { x: e.clientX, y: e.clientY, items } }))
    },
    [s.lang, s.notes, s.projects, startNoteRename, duplicateNote, moveNoteToProject, deleteNoteById]
  )

  // ---- AI (real backend) ----
  const aiOrganize = useCallback(async () => {
    const raw = s.aiInput.trim()
    if (!raw) {
      setS((prev) => ({ ...prev, aiErr: true, aiStatus: L[prev.lang].aiNeed }))
      return
    }
    setS((prev) => ({ ...prev, aiLoading: true, aiErr: false, aiStatus: L[prev.lang].aiOrganizing }))
    const note = active
    const ep = resolveEndpoint(s.provider, s.providerConfig[s.provider])!
    const res = await window.catch.aiOrganize({
      ...ep,
      mode: note.mode,
      categories: cats(note.mode).map((c) => c.k),
      rawText: raw,
      lang: s.lang
    })
    if (res.ok && res.data) {
      const add: Note['items'] = res.data.map((d) => ({
        id: rid(),
        cat: d.cat,
        text: d.text,
        owner: d.owner || '',
        by: 'ai' as const
      }))
      setS((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === prev.activeId ? { ...n, items: [...n.items, ...add] } : n
        ),
        aiLoading: false,
        aiInput: '',
        aiErr: false,
        aiStatus: L[prev.lang].aiAdded(add.length)
      }))
    } else {
      setS((prev) => ({ ...prev, aiLoading: false, aiErr: true, aiStatus: res.error || 'Error' }))
    }
  }, [s.aiInput, s.provider, s.providerConfig, s.lang, active, cats])

  const aiEval = useCallback(async () => {
    if (active.items.length === 0) {
      setS((prev) => ({ ...prev, evalStatus: L[prev.lang].evalNeed }))
      return
    }
    setS((prev) => ({ ...prev, evalLoading: true, evalStatus: L[prev.lang].evaluating, evalDone: false }))
    const ep = resolveEndpoint(s.provider, s.providerConfig[s.provider])!
    const res = await window.catch.aiEval({
      ...ep,
      mode: active.mode,
      lang: s.lang,
      items: active.items.map((i) => ({ cat: i.cat, text: itxt(i, s.lang), owner: ownerDisp(i.owner, s.lang) }))
    })
    if (res.ok && res.data) {
      setS((prev) => ({ ...prev, evalLoading: false, evalStatus: '', evalDone: true, evalResult: res.data! }))
    } else {
      setS((prev) => ({ ...prev, evalLoading: false, evalStatus: res.error || 'Error', evalDone: false }))
    }
  }, [active, s.provider, s.providerConfig, s.lang])

  const setProviderCfg = useCallback((patch: Partial<ProviderConfig>) => {
    setS((prev) => ({
      ...prev,
      providerConfig: {
        ...prev.providerConfig,
        [prev.provider]: { ...prev.providerConfig[prev.provider], ...patch }
      }
    }))
  }, [])

  const setIntegration = useCallback((patch: Partial<Integrations>) => {
    setS((prev) => ({ ...prev, integrations: { ...prev.integrations, ...patch } }))
  }, [])

  const saveNotionToken = useCallback(async () => {
    const token = s.notionToken.trim()
    // Stored in the same encrypted secrets store as provider keys, keyed 'notion'.
    const res = await window.catch.setApiKey('notion', token)
    if (!res.ok) {
      showToast(res.error || 'Error')
      return
    }
    setS((prev) => ({ ...prev, notionToken: '', notionConnected: !!token }))
    showToast(L[s.lang].notionSavedText)
  }, [s.notionToken, s.lang, showToast])

  const connect = useCallback(async () => {
    const provider = s.provider
    const info = getProviderInfo(provider)
    if (!info) return
    const cfg = s.providerConfig[provider]
    const key = s.apiKey.trim()
    if ((info.configurableBaseUrl || info.custom) && !effectiveBaseUrl(info, cfg)) {
      showToast(T.tNeedBaseUrl)
      return
    }
    if (!effectiveModel(info, cfg)) {
      showToast(T.tNeedModel)
      return
    }
    if (!info.keyless && !info.keyOptional && !key) {
      showToast(T.tNeedKey)
      return
    }
    if (key) {
      const res = await window.catch.setApiKey(provider, key)
      if (!res.ok) {
        showToast(res.error || 'Error')
        return
      }
    }
    // Actually test the connection — only mark connected if the provider replies.
    setS((prev) => ({ ...prev, verifying: true }))
    const ep = resolveEndpoint(provider, s.providerConfig[provider])
    const vr = ep
      ? await window.catch.verifyProvider(ep)
      : { ok: false, error: 'Invalid provider.' }
    if (vr.ok) {
      setS((prev) => ({
        ...prev,
        verifying: false,
        apiKey: '',
        connectedProviders: prev.connectedProviders.includes(provider)
          ? prev.connectedProviders
          : [...prev.connectedProviders, provider]
      }))
      showToast(T.tConn(providerLabel(provider)))
    } else {
      setS((prev) => ({
        ...prev,
        verifying: false,
        connectedProviders: prev.connectedProviders.filter((p) => p !== provider)
      }))
      showToast(vr.error || 'Error')
    }
  }, [s.provider, s.apiKey, s.providerConfig, T, showToast])

  // ---- exports (real backend) ----
  const doExportMarkdown = useCallback(async () => {
    const built = buildExport(active, s.lang)
    const res = await window.catch.exportMarkdown({ filename: built.filename, markdown: built.markdown, title: built.title })
    if (res.ok) showToast(T.tMd)
    else if (!res.cancelled) showToast(res.error || 'Error')
  }, [active, s.lang, T, showToast])

  const doExportCopy = useCallback(async () => {
    const built = buildExport(active, s.lang)
    await window.catch.copyText(built.plain)
    showToast(T.tCopy)
  }, [active, s.lang, T, showToast])

  const doExportObsidian = useCallback(async () => {
    const built = buildExport(active, s.lang)
    const res = await window.catch.openObsidian({ filename: built.filename, markdown: built.markdown, title: built.title })
    if (res.ok) showToast(T.tObsidian)
    else showToast(res.error || 'Error')
  }, [active, s.lang, T, showToast])

  const doExportNotion = useCallback(async () => {
    const built = buildExport(active, s.lang)
    const res = await window.catch.exportNotion({ filename: built.filename, markdown: built.markdown, title: built.title })
    if (res.ok) showToast(res.target ? `${T.tNotion}` : T.tNotion)
    else showToast(res.error || 'Error')
  }, [active, s.lang, T, showToast])

  // ---- global key handling for staged classification ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (s.staged === null) return
      const tag = ((e.target as HTMLElement)?.tagName || '').toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const list = cats(active.mode)
      if (/^[1-9]$/.test(e.key) && +e.key <= list.length) {
        e.preventDefault()
        fileItem(list[+e.key - 1].k, s.staged, 'self')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setS((prev) => ({ ...prev, staged: null, draft: prev.staged || '' }))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [s.staged, active.mode, cats, fileItem])

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current)
      clearTimeout(saveTimer.current)
    },
    []
  )

  // ---- derived view-model (port of renderVals) ----
  const vals = useMemo(() => {
    const lang = s.lang
    const note = active
    const mode = note.mode
    const armed = s.staged !== null
    const mineCount = note.items.length
    const proj = s.projects.find((p) => p.id === note.projectId)

    const projectGroups = s.projects.map((p) => {
      const pnotes = s.notes.filter((n) => n.projectId === p.id)
      const open = !s.collapsed[p.id]
      return {
        id: p.id,
        name: pname(p, lang),
        count: String(pnotes.length),
        open,
        caretRot: open ? 'rotate(90deg)' : 'rotate(0deg)',
        editing: s.editingProjectId === p.id,
        onToggle: () => toggleProject(p.id),
        onContextMenu: (e: React.MouseEvent) => openProjectMenu(e, p.id),
        notes: pnotes.map((n) => {
          const act = n.id === s.activeId
          return {
            id: n.id,
            title: ntitle(n, lang),
            modeLabel: T.modeLabel[n.mode],
            date: n.date,
            count: T.count(n.items.length),
            accent: MODES[n.mode].accent,
            bg: act ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.04)',
            border: act ? 'rgba(255,255,255,.36)' : 'rgba(255,255,255,.08)',
            metaColor: act ? '#CDE0D7' : '#8FB3A6',
            editing: s.editingNoteId === n.id,
            onClick: () => selectNote(n.id),
            onContextMenu: (e: React.MouseEvent) => openNoteMenu(e, n.id)
          }
        })
      }
    })

    // muscle
    const allItems = s.notes.flatMap((n) => n.items)
    const aiN = allItems.filter((i) => i.by === 'ai').length
    const aiPct = allItems.length ? Math.round((aiN / allItems.length) * 100) : 0
    const selfTotal = allItems.length - aiN
    const level = Math.min(5, 1 + Math.floor(selfTotal / 8))
    const levelPct = selfTotal === 0 ? 0 : Math.max(8, Math.round(((selfTotal % 8) / 8) * 100))
    const todayStr = today()
    const streakDays = captureStreak(s.notes, todayStr)
    const wDelta = weekScoreDelta(s.notes, todayStr)
    const muscle = {
      streakText: T.streak(streakDays),
      title: T.muscle,
      levelLabel: `Lv.${level}`,
      toNextText: T.toNext(8 - (selfTotal % 8)),
      levelPct,
      wheelsLabel: T.wheels,
      aiPct,
      relianceLabel: T.reliance,
      weekLabel: T.week,
      weekDelta: wDelta === null ? '—' : wDelta > 0 ? `+${wDelta}` : String(wDelta),
      weekDeltaColor: wDelta === null ? '#9CC0B2' : wDelta >= 0 ? '#5FD0A6' : '#E8A0A0',
      weekDescLabel: T.weekDesc
    }

    const catButtons = cats(mode).map((c, idx) => {
      const h = HUE[c.h]
      return {
        kbd: String(idx + 1),
        label: catLabel(c.k),
        bg: armed ? h.bg : '#fff',
        border: armed ? h.bd : '#E6EAE8',
        fg: armed ? h.fg : '#5A636D',
        kbdFg: armed ? h.fg : '#98A2AA',
        kbdBg: '#fff',
        kbdBorder: armed ? h.bd : '#CFD6D2',
        onClick: () => classify(c.k)
      }
    })

    const captured = note.items.map((i) => {
      const h = catHue(mode, i.cat)
      return {
        id: i.id,
        label: catLabel(i.cat),
        chipBg: h.bg,
        chipFg: h.fg,
        text: itxt(i, lang),
        owner: ownerDisp(i.owner, lang),
        hasOwner: !!i.owner,
        isAi: i.by === 'ai',
        onRemove: () => removeItem(i.id)
      }
    })

    const summary: any[] = []
    for (const c of cats(mode)) {
      const sub = note.items.filter((i) => i.cat === c.k)
      if (!sub.length) continue
      const h = HUE[c.h]
      summary.push({
        key: c.k,
        label: catLabel(c.k),
        fg: h.fg,
        markBg: `linear-gradient(transparent 55%, ${h.bg} 55%)`,
        dot: h.dot,
        count: String(sub.length),
        items: sub.map((i) => ({ id: i.id, text: itxt(i, lang), owner: ownerDisp(i.owner, lang), hasOwner: !!i.owner }))
      })
    }

    // score
    const r = scoreNote(note)
    const CRIT = ['brevity', 'action', 'oneidea', 'complete', 'clarity'] as const
    const crits = CRIT.map((k) => {
      const c = r.crit[k]
      const na = !c || c.pct === null
      return {
        name: T.crit[k],
        pct: na ? 0 : (c!.pct as number),
        color: na ? '#D7DEDA' : barColor(c!.pct as number),
        scoreText: na ? '—' : String(c!.pct)
      }
    })
    let lab = T.tierNone
    let sub = ''
    if (r.overall !== null) {
      const applic = crits.filter((c) => c.scoreText !== '—')
      const worst = applic.length ? Math.min(...applic.map((c) => +c.scoreText)) : 100
      if (r.overall >= 80 && worst >= 55) lab = T.tierStrong
      else if (r.overall >= 60) lab = T.tierGood
      else if (r.overall >= 40) lab = T.tierOk
      else lab = T.tierWeak
      const self = note.items.filter((i) => i.by === 'self').length
      sub = T.scoreSub(Math.round((self / Math.max(mineCount, 1)) * 100), applic.length)
    }
    const score = { value: r.overall === null ? '—' : r.overall, label: lab, sub, crits }

    // trend
    const modeNotes = s.notes
      .filter((n) => n.mode === mode && n.items.length)
      .sort((a, b) => a.date.localeCompare(b.date))
    let trend: any = { show: false }
    const data = modeNotes
      .map((n) => ({ d: n.date, s: scoreNote(n).overall }))
      .filter((p): p is { d: string; s: number } => p.s !== null)
    if (data.length) {
      const W = 300
      const padL = 20
      const padR = 8
      const top = 14
      const bottom = 82
      const xs = data.length === 1 ? [W / 2] : data.map((_, i) => padL + (i * (W - padL - padR)) / (data.length - 1))
      const yOf = (v: number) => top + (1 - v / 100) * (bottom - top)
      const pts = data.map((p, i) => ({ x: xs[i], y: yOf(p.s) }))
      const lineD = pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ')
      const areaD =
        data.length > 1
          ? lineD + ` L${pts[pts.length - 1].x.toFixed(1)} ${bottom} L${pts[0].x.toFixed(1)} ${bottom} Z`
          : ''
      const best = Math.max(...data.map((p) => p.s))
      const diff = data[data.length - 1].s - data[0].s
      let tnote = T.trendOne
      if (data.length > 1) {
        if (diff >= 5) tnote = T.trendUp(diff)
        else if (diff <= -5) tnote = T.trendDown
        else tnote = T.trendFlat
      }
      trend = {
        show: true,
        title: T.trend,
        stat: T.trendStat(data.length, best),
        lineD,
        areaD,
        dots: pts.map((p) => ({ cx: p.x.toFixed(1), cy: p.y.toFixed(1) })),
        note: tnote
      }
    }

    const langSel = '#14584A'
    const langSelBg = '#E3EFEA'
    const langOff = '#CFD6D2'

    // ---- AI provider settings view ----
    const provInfo = getProviderInfo(s.provider)
    const provCfg = s.providerConfig[s.provider]
    const connected =
      s.connectedProviders.includes(s.provider) ||
      (!!provInfo && (provInfo.keyless || provInfo.keyOptional) && isConfigured(s.provider, provCfg, false))
    const providerList = PROVIDERS.map((p) => ({ id: p.id, label: p.label }))

    // ---- software update view ----
    const u = s.update
    let updText = ''
    let updAction: 'download' | 'install' | null = null
    switch (u.state) {
      case 'checking':
        updText = T.upd.checking
        break
      case 'available':
        updText = T.upd.available(u.version || '')
        updAction = 'download'
        break
      case 'none':
        updText = T.upd.latest
        break
      case 'progress':
        updText = T.upd.downloading(u.percent ?? 0)
        break
      case 'downloaded':
        updText = T.upd.ready(u.version || '')
        updAction = 'install'
        break
      case 'error':
        updText = `${T.upd.errorLabel}: ${u.message || ''}`
        break
      default:
        updText = ''
    }
    let updPill: { text: string; action: 'download' | 'install' | null } | null = null
    if (u.state === 'available') updPill = { text: `${T.upd.pillUpdate} v${u.version}`, action: 'download' }
    else if (u.state === 'progress') updPill = { text: T.upd.downloading(u.percent ?? 0), action: null }
    else if (u.state === 'downloaded') updPill = { text: T.upd.pillRestart, action: 'install' }

    return {
      brandLabel: T.brand,
      titlebarText: T.titlebar,
      appSubtitle: T.subtitle,
      settingsLabel: T.settings,
      helpLabel: T.help,
      newNoteLabel: T.newNote,
      newProjectLabel: T.newProject,
      muscle,
      projectGroups,
      cats: catButtons,
      captured,
      summary,
      score,
      trend,
      active: {
        title: typeof note.title === 'string' ? note.title : note.title[lang] || note.title.ko,
        date: note.date,
        countText: T.captured(mineCount),
        modeLabel: T.modeLabel[mode],
        modeDot: MODES[mode].accent,
        projectName: proj ? pname(proj, lang) : '',
        coach: T.coachText[mode],
        catCount: cats(mode).length,
        mode
      },
      titlePh: T.titlePh,
      coachLabel: T.coach,
      isStaged: armed,
      notStaged: !armed,
      stagedText: s.staged || '',
      stagedAsk: T.stagedAsk,
      stagedOr: T.stagedOr,
      editLabel: T.edit,
      composerPh: T.composerPh,
      isEmpty: mineCount === 0,
      emptyCapture: T.emptyCapture,
      draft: s.draft,
      aiInput: s.aiInput,
      hintText: armed ? T.hintArmed : T.hintDefault,
      ownerHint: T.ownerHint,
      aiBackupLabel: T.aiBackup,
      aiPh: T.aiPh,
      aiOrganizeLabel: T.aiOrganize,
      aiLoading: s.aiLoading,
      aiStatus: s.aiStatus,
      aiStatusColor: s.aiErr ? '#c0392b' : '#5A636D',
      rightHeaderLabel: T.rightHeader,
      shareHintLabel: T.shareHint,
      aiEvalLabel: T.aiEval,
      evalLoading: s.evalLoading,
      evalStatus: s.evalStatus,
      hasEval: s.evalDone && !!s.evalResult,
      evalGoodLabel: T.evalGood,
      evalImproveLabel: T.evalImprove,
      evalRewriteLabel: T.evalRewrite,
      beforeLabel: T.before,
      afterLabel: T.after,
      evalResult: s.evalResult ?? { good: '', improve: '', before: '', after: '' },
      summaryTitleLabel: T.summaryTitle,
      emptySummaryLabel: T.emptySummary,
      expNotionLabel: T.expNotion,
      expMdLabel: T.expMd,
      expCopyLabel: T.expCopy,
      expObsidianLabel: T.expObsidian,
      delNoteLabel: T.delNote,
      toast: { show: !!s.toast, msg: s.toast || '' },
      // settings
      settingsOpen: s.settingsOpen,
      setTitleLabel: T.setTitle,
      setAiLabel: T.setAi,
      setAiDescLabel: T.setAiDesc,
      setProviderLabel: T.setProvider,
      setKeyLabel: T.setKey,
      setKeyPh: provInfo?.keyPlaceholder || T.setKeyPh,
      setBaseUrlLabel: T.setBaseUrl,
      setBaseUrlPh: provInfo?.baseUrl || T.setBaseUrlPh,
      setModelLabel: T.setModel,
      setModelHint: T.setModelHint,
      getKeyLabel: T.getKey,
      setConnectLabel: T.setConnect,
      setLangLabel: T.setLang,
      doneLabel: T.done,
      providerList,
      provider: s.provider,
      apiKey: s.apiKey,
      verifying: s.verifying,
      // provider-specific field visibility / values
      showKey: !provInfo?.keyless,
      showBaseUrl: !!(provInfo?.configurableBaseUrl || provInfo?.custom),
      showModel: !!provInfo,
      baseUrlValue: provCfg?.baseUrl || '',
      modelValue: provCfg?.model || '',
      modelPh: provInfo?.defaultModel || 'model-name',
      providerDocs: provInfo?.docs || '',
      connected,
      connectedText: T.connected(providerLabel(s.provider)),
      // integrations (export)
      setIntegrationsLabel: T.setIntegrations,
      setIntegrationsDescLabel: T.setIntegrationsDesc,
      notionSectionLabel: T.notionLabel,
      notionTokenLabel: T.notionTokenLabel,
      notionTokenPh: T.notionTokenPh,
      notionParentLabel: T.notionParentLabel,
      notionParentPh: T.notionParentPh,
      obsidianSectionLabel: T.obsidianLabel,
      obsidianVaultLabel: T.obsidianVaultLabel,
      obsidianVaultPh: T.obsidianVaultPh,
      saveLabel: T.saveLabel,
      notionConnected: s.notionConnected,
      notionConnectedText: T.notionSavedText,
      notionToken: s.notionToken,
      notionParentValue: s.integrations.notionParentPageId || '',
      obsidianVaultValue: s.integrations.obsidianVault || '',
      // software update
      appVersion: s.appVersion,
      updTitleLabel: T.upd.title,
      updCheckLabel: T.upd.check,
      updCurrentText: T.upd.current(s.appVersion || '—'),
      updText,
      updChecking: u.state === 'checking',
      updDownloadLabel: T.upd.download,
      updRestartLabel: T.upd.restart,
      updActionDownload: updAction === 'download',
      updActionInstall: updAction === 'install',
      updPill,
      isKo: lang === 'ko',
      isEn: lang === 'en',
      langKoBorder: lang === 'ko' ? langSel : langOff,
      langKoBg: lang === 'ko' ? langSelBg : '#fff',
      langKoFg: lang === 'ko' ? langSel : '#5A636D',
      langEnBorder: lang === 'en' ? langSel : langOff,
      langEnBg: lang === 'en' ? langSelBg : '#fff',
      langEnFg: lang === 'en' ? langSel : '#5A636D',
      // handlers
      onOpenSettings: () => setS((p) => ({ ...p, settingsOpen: true })),
      onCloseSettings: () => setS((p) => ({ ...p, settingsOpen: false })),
      onHelp: () => {
        const osName =
          ({ darwin: 'macOS', win32: 'Windows', linux: 'Linux' } as Record<string, string>)[
            window.catch.platform
          ] || window.catch.platform
        const env = `\n\n---\n- App version: v${s.appVersion || '?'}\n- OS: ${osName}`
        const body =
          s.lang === 'ko'
            ? `## 무슨 일이 있었나요?\n\n(문제나 제안을 적어주세요)\n\n## 재현 방법\n\n1. \n2. \n\n## 예상 동작\n${env}\n`
            : `## What happened?\n\n(Describe the problem or request)\n\n## Steps to reproduce\n\n1. \n2. \n\n## Expected behavior\n${env}\n`
        window.open(
          `https://github.com/jkapa0417/catch/issues/new?body=${encodeURIComponent(body)}`,
          '_blank'
        )
      },
      onProviderChange: (v: Provider) => setS((p) => ({ ...p, provider: v, apiKey: '' })),
      onKeyInput: (v: string) => setS((p) => ({ ...p, apiKey: v })),
      onBaseUrlInput: (v: string) => setProviderCfg({ baseUrl: v }),
      onModelInput: (v: string) => setProviderCfg({ model: v }),
      onConnect: connect,
      onNotionTokenInput: (v: string) => setS((p) => ({ ...p, notionToken: v })),
      onNotionParentInput: (v: string) => setIntegration({ notionParentPageId: v }),
      onObsidianVaultInput: (v: string) => setIntegration({ obsidianVault: v }),
      onSaveNotion: saveNotionToken,
      onCheckUpdate: () => window.catch.checkForUpdates(),
      onDownloadUpdate: () => window.catch.downloadUpdate(),
      onInstallUpdate: () => window.catch.installUpdate(),
      onLangKo: () => setS((p) => ({ ...p, lang: 'ko' })),
      onLangEn: () => setS((p) => ({ ...p, lang: 'en' })),
      onTitleInput: (v: string) => patchActive({ title: v }),
      onDateInput: (v: string) => patchActive({ date: v }),
      onDraftInput: (v: string) => setS((p) => ({ ...p, draft: v })),
      onComposerEnter: () =>
        setS((p) => (p.draft.trim() ? { ...p, staged: p.draft.trim(), draft: '' } : p)),
      onUnstage: () => setS((p) => ({ ...p, staged: null, draft: p.staged || '' })),
      onAiInput: (v: string) => setS((p) => ({ ...p, aiInput: v })),
      onAiOrganize: aiOrganize,
      onAiEval: aiEval,
      onNewNoteMenu: openNewNoteMenu,
      onNewProject: newProject,
      onDeleteNote: deleteNote,
      onModeChange: (m: Mode) => patchActive({ mode: m }),
      onExportNotion: doExportNotion,
      onExportMd: doExportMarkdown,
      onExportCopy: doExportCopy,
      onExportObsidian: doExportObsidian,
      // context menu + inline rename
      menu: s.menu,
      onCloseMenu: closeMenu,
      editingProjectId: s.editingProjectId,
      editingNoteId: s.editingNoteId,
      onCommitProjectRename: commitProjectRename,
      onCommitNoteRename: commitNoteRename,
      onCancelRename: cancelRename
    }
  }, [s, active, T, cats, catLabel, catHue, classify, removeItem, toggleProject, selectNote, connect, setProviderCfg, setIntegration, saveNotionToken, aiOrganize, aiEval, newProject, deleteNote, patchActive, doExportNotion, doExportMarkdown, doExportCopy, doExportObsidian, openProjectMenu, openNoteMenu, openNewNoteMenu, closeMenu, commitProjectRename, commitNoteRename, cancelRename])

  return vals
}

export type Vals = ReturnType<typeof useApp>

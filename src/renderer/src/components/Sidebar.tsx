import { useRef, useState } from 'react'
import { E } from './El'
import type { Vals } from '../state/useApp'

/** Inline rename field used for projects and notes in the sidebar. */
function RenameInput({
  initial,
  font,
  onCommit,
  onCancel
}: {
  initial: string
  font: string
  onCommit: (v: string) => void
  onCancel: () => void
}) {
  const [val, setVal] = useState(initial)
  const done = useRef(false)
  const finish = (commit: boolean) => {
    if (done.current) return
    done.current = true
    commit ? onCommit(val) : onCancel()
  }
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(true)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          finish(false)
        }
      }}
      onBlur={() => finish(true)}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'rgba(255,255,255,.14)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,.4)',
        borderRadius: 6,
        padding: '2px 6px',
        font,
        outline: 'none'
      }}
    />
  )
}

export default function Sidebar({ v }: { v: Vals }) {
  const m = v.muscle
  return (
    <div
      className="sb-dark"
      style={{
        width: 284,
        flexShrink: 0,
        background: 'linear-gradient(186deg,#17604F 0%,#114A3D 60%,#0E3F34 100%)',
        color: '#EAF2EE',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
    >
      {/* header */}
      <div style={{ padding: '18px 18px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', color: '#fff', lineHeight: 1 }}>{v.brandLabel}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CC0B2', marginTop: 5, lineHeight: 1.4 }}>{v.appSubtitle}</div>
        </div>
        <E
          tag="button"
          data-testid="settings-btn"
          onClick={v.onOpenSettings}
          s="flex-shrink:0;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#CDE0D7;cursor:pointer;font:700 11px 'Pretendard';padding:6px 11px;border-radius:8px"
          hov="background:rgba(255,255,255,.13)"
        >
          {v.settingsLabel}
        </E>
      </div>

      {/* new note */}
      <div style={{ padding: '6px 14px 8px' }}>
        <E
          tag="button"
          data-testid="new-note-btn"
          onClick={v.onNewNoteMenu}
          s="width:100%;border:1px dashed rgba(255,255,255,.28);background:rgba(255,255,255,.06);color:#EAF2EE;cursor:pointer;font:700 13px 'Pretendard';padding:10px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:7px"
          hov="background:rgba(255,255,255,.12)"
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span> {v.newNoteLabel}
        </E>
      </div>

      {/* project groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px 10px', minHeight: 0 }}>
        {v.projectGroups.map((p) => (
          <div key={p.id} style={{ marginBottom: 6 }}>
            <button
              data-testid="project-header"
              onClick={p.onToggle}
              onContextMenu={p.onContextMenu}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 6px', color: '#fff' }}
            >
              <svg width="9" height="9" viewBox="0 0 12 12" style={{ transform: p.caretRot, transition: 'transform .12s', flexShrink: 0, color: '#7FA899' }}>
                <path d="M4 2 L8 6 L4 10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {p.editing ? (
                <RenameInput
                  initial={p.name}
                  font="800 12.5px 'Pretendard'"
                  onCommit={(val) => v.onCommitProjectRename(p.id, val)}
                  onCancel={v.onCancelRename}
                />
              ) : (
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left', font: "800 12.5px 'Pretendard'", color: '#EAF2EE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              )}
              <span style={{ font: '700 10px ui-monospace,monospace', color: '#7FA899' }}>{p.count}</span>
            </button>
            {p.open && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '2px 0 6px 6px' }}>
                {p.notes.map((n) => (
                  <button
                    key={n.id}
                    data-testid="note-item"
                    onClick={n.onClick}
                    onContextMenu={n.onContextMenu}
                    style={{ textAlign: 'left', border: `1px solid ${n.border}`, background: n.bg, cursor: 'pointer', borderRadius: 11, padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, flexShrink: 0, background: n.accent }} />
                      {n.editing ? (
                        <RenameInput
                          initial={n.title}
                          font="700 13px 'Pretendard'"
                          onCommit={(val) => v.onCommitNoteRename(n.id, val)}
                          onCancel={v.onCancelRename}
                        />
                      ) : (
                        <span style={{ flex: 1, minWidth: 0, font: "700 13px 'Pretendard'", color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                      )}
                      <span style={{ font: '700 10px ui-monospace,monospace', color: n.metaColor }}>{n.count}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', paddingLeft: 15 }}>
                      <span style={{ font: '600 10px ui-monospace,monospace', color: n.metaColor }}>{n.modeLabel}</span>
                      <span style={{ font: '600 10px ui-monospace,monospace', color: n.metaColor, opacity: 0.7 }}>{n.date}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <E
          tag="button"
          onClick={v.onNewProject}
          s="width:100%;margin-top:4px;border:none;background:transparent;color:#7FA899;cursor:pointer;font:700 12px 'Pretendard';padding:8px 6px;text-align:left;display:flex;align-items:center;gap:7px"
          hov="color:#CDE0D7"
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>＋</span> {v.newProjectLabel}
        </E>
      </div>

      {/* muscle level card */}
      <div style={{ margin: '0 14px 16px', background: 'rgba(0,0,0,.18)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ font: "800 13px 'Pretendard'", color: '#fff', display: 'flex', alignItems: 'baseline', gap: 7 }}>
            {m.title} <span style={{ font: '800 13px ui-monospace,monospace', color: '#F0C36B' }}>{m.levelLabel}</span>
          </span>
          <span style={{ font: '700 10px ui-monospace,monospace', color: '#9CC0B2' }}>{m.toNextText}</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.14)', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#5FD0A6,#F0C36B)', width: `${m.levelPct}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 9, padding: '8px 9px' }}>
            <div style={{ font: '700 9px ui-monospace,monospace', letterSpacing: '.04em', color: '#9CC0B2' }}>{m.wheelsLabel}</div>
            <div style={{ font: "800 17px 'Pretendard'", color: '#fff', marginTop: 2 }}>
              {m.aiPct}
              <span style={{ fontSize: 11, color: '#9CC0B2' }}>%</span>
            </div>
            <div style={{ font: "600 9.5px 'Pretendard'", color: '#7FA899', marginTop: 1 }}>{m.relianceLabel}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 9, padding: '8px 9px' }}>
            <div style={{ font: '700 9px ui-monospace,monospace', letterSpacing: '.04em', color: '#9CC0B2' }}>{m.weekLabel}</div>
            <div style={{ font: "800 17px 'Pretendard'", color: m.weekDeltaColor, marginTop: 2 }}>{m.weekDelta}</div>
            <div style={{ font: "600 9.5px 'Pretendard'", color: '#7FA899', marginTop: 1 }}>{m.weekDescLabel}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

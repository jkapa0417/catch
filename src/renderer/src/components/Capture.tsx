import type { Mode } from '@shared/types'
import { E } from './El'
import type { Vals } from '../state/useApp'

const MODE_ORDER: Mode[] = ['meeting', 'brainstorm', 'switch', 'daily']

export default function Capture({ v }: { v: Vals }) {
  const a = v.active
  const cycleMode = () => {
    const idx = MODE_ORDER.indexOf(a.mode)
    v.onModeChange(MODE_ORDER[(idx + 1) % MODE_ORDER.length])
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#ECEFEE', minHeight: 0 }}>
      {/* note header */}
      <div style={{ flexShrink: 0, padding: '18px 26px 14px', background: '#fff', borderBottom: '1px solid #E6EAE8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <button
            onClick={cycleMode}
            title="Click to change mode"
            style={{ font: "700 11px 'Pretendard'", color: '#3F4C59', background: '#EEF3F1', padding: '4px 11px 4px 9px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 2, background: a.modeDot }} />
            {a.modeLabel}
          </button>
          <span style={{ font: '600 11px ui-monospace,monospace', color: '#98A2AA' }}>{a.projectName}</span>
          <span style={{ font: '600 11px ui-monospace,monospace', color: '#C0C8CC' }}>·</span>
          <span style={{ font: '600 11px ui-monospace,monospace', color: '#98A2AA' }}>{a.countText}</span>
        </div>
        <input
          value={a.title}
          onChange={(e) => v.onTitleInput(e.target.value)}
          placeholder={v.titlePh}
          style={{ border: 'none', outline: 'none', background: 'transparent', font: "800 24px 'Pretendard'", letterSpacing: '-.02em', color: '#1D242B', width: '100%', padding: 0 }}
        />
        <input
          value={a.date}
          onChange={(e) => v.onDateInput(e.target.value)}
          placeholder="2026-06-18"
          style={{ border: 'none', outline: 'none', background: 'transparent', font: '600 13px ui-monospace,monospace', color: '#98A2AA', width: 200, padding: '4px 0 0', marginTop: 2 }}
        />
      </div>

      {/* capture scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 28px', minHeight: 0 }}>
        {/* coach */}
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: '#fff', border: '1px dashed #CFD6D2', borderRadius: 13, padding: '12px 14px', marginBottom: 16 }}>
          <span style={{ flexShrink: 0, font: '800 9px ui-monospace,monospace', letterSpacing: '.08em', color: '#14584A', background: '#E3EFEA', padding: '4px 7px', borderRadius: 6, marginTop: 1 }}>{v.coachLabel}</span>
          <span style={{ font: "500 13px/1.6 'Pretendard'", color: '#5A636D' }}>{a.coach}</span>
        </div>

        {/* composer */}
        {v.isStaged ? (
          <div style={{ border: '1.5px solid #14584A', background: '#E3EFEA', borderRadius: 14, padding: '14px 15px', marginBottom: 11, animation: 'pop .14s ease' }}>
            <div style={{ font: "600 16px/1.45 'Pretendard'", color: '#1D242B', wordBreak: 'break-word' }}>{v.stagedText}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, font: "600 12px 'Pretendard'", color: '#14584A' }}>
              <span>{v.stagedAsk}</span>
              <span style={{ font: '700 11px ui-monospace,monospace', background: '#fff', border: '1px solid #B9D5C9', borderRadius: 5, padding: '1px 6px' }}>1 · 2 · 3 · 4</span>
              <span style={{ color: '#98A2AA' }}>{v.stagedOr}</span>
              <button onClick={v.onUnstage} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#5A636D', font: "700 12px 'Pretendard'", textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>{v.editLabel}</button>
            </div>
          </div>
        ) : (
          <E
            tag="textarea"
            value={v.draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => v.onDraftInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                v.onComposerEnter()
              }
            }}
            placeholder={v.composerPh}
            s="width:100%;border:1.5px solid #CFD6D2;border-radius:14px;padding:14px 15px;font:500 16px 'Pretendard';color:#1D242B;resize:none;outline:none;background:#fff;min-height:58px;margin-bottom:11px;line-height:1.5"
            foc="border:1.5px solid #14584A"
          />
        )}

        {/* category buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${a.catCount},1fr)`, gap: 9 }}>
          {v.cats.map((c, idx) => (
            <E
              key={idx}
              tag="button"
              onClick={c.onClick}
              s={`border:1.5px solid ${c.border};background:${c.bg};border-radius:12px;padding:11px 6px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:transform .06s`}
              hov="transform:translateY(-1px)"
            >
              <span style={{ font: '700 11px ui-monospace,monospace', color: c.kbdFg, border: `1px solid ${c.kbdBorder}`, background: c.kbdBg, borderRadius: 5, padding: '1px 6px' }}>{c.kbd}</span>
              <span style={{ font: "700 13.5px 'Pretendard'", color: c.fg }}>{c.label}</span>
            </E>
          ))}
        </div>

        <div style={{ font: "500 12px/1.5 'Pretendard'", color: '#98A2AA', marginTop: 11 }}>
          {v.hintText} · {v.ownerHint}
        </div>

        {/* captured list */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {v.isEmpty && (
            <div style={{ textAlign: 'center', color: '#98A2AA', font: "500 14px 'Pretendard'", padding: '34px 8px', background: '#fff', border: '1px dashed #CFD6D2', borderRadius: 13 }}>{v.emptyCapture}</div>
          )}
          {v.captured.map((i) => (
            <E
              key={i.id}
              data-testid="captured-item"
              s="display:flex;gap:11px;align-items:flex-start;padding:12px 13px;border-radius:12px;background:#fff;border:1px solid #E6EAE8"
              hov="border:1px solid #CFD6D2"
            >
              <span style={{ flexShrink: 0, font: '700 11px ui-monospace,monospace', padding: '5px 8px', borderRadius: 7, marginTop: 1, background: i.chipBg, color: i.chipFg }}>{i.label}</span>
              <span style={{ flex: 1, minWidth: 0, font: "500 14.5px/1.5 'Pretendard'", color: '#1D242B', wordBreak: 'break-word' }}>
                {i.text}
                {i.hasOwner && (
                  <span style={{ font: '700 11px ui-monospace,monospace', background: '#E3EFEA', color: '#14584A', padding: '1px 7px', borderRadius: 6, marginLeft: 7 }}>@{i.owner}</span>
                )}
              </span>
              {i.isAi && <span style={{ font: '700 9px ui-monospace,monospace', color: '#98A2AA', border: '1px solid #CFD6D2', borderRadius: 5, padding: '2px 5px', marginTop: 3, flexShrink: 0 }}>AI</span>}
              <E
                tag="button"
                onClick={i.onRemove}
                s="border:none;background:transparent;color:#C0C8CC;cursor:pointer;font-size:15px;line-height:1;padding:3px 4px;flex-shrink:0"
                hov="color:#c0392b"
              >
                ✕
              </E>
            </E>
          ))}
        </div>

        {/* AI backup */}
        <div style={{ marginTop: 24, borderTop: '1px dashed #CFD6D2', paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, font: '700 11px ui-monospace,monospace', letterSpacing: '.03em', color: '#5A636D', marginBottom: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14584A' }} />
            {v.aiBackupLabel}
          </div>
          <E
            tag="textarea"
            value={v.aiInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => v.onAiInput(e.target.value)}
            placeholder={v.aiPh}
            s="width:100%;min-height:60px;border:1.5px solid #CFD6D2;border-radius:12px;padding:11px 13px;font:500 14px 'Pretendard';resize:vertical;outline:none;background:#fff;line-height:1.5"
            foc="border:1.5px solid #14584A"
          />
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 10 }}>
            <button onClick={v.onAiOrganize} disabled={v.aiLoading} style={{ border: 'none', borderRadius: 10, padding: '10px 16px', font: "700 13px 'Pretendard'", cursor: v.aiLoading ? 'default' : 'pointer', background: '#14584A', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, opacity: v.aiLoading ? 0.85 : 1 }}>
              {v.aiLoading && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
              {v.aiOrganizeLabel}
            </button>
            <span style={{ font: "600 12px 'Pretendard'", color: v.aiStatusColor }}>{v.aiStatus}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

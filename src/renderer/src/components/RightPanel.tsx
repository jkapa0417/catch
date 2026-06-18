import { E } from './El'
import type { Vals } from '../state/useApp'

export default function RightPanel({ v }: { v: Vals }) {
  const sc = v.score
  return (
    <div style={{ width: 392, flexShrink: 0, background: '#F5F8F6', borderLeft: '1px solid #E6EAE8', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flexShrink: 0, padding: '16px 20px 13px', borderBottom: '1px solid #E6EAE8', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ font: "800 14px 'Pretendard'", letterSpacing: '-.01em' }}>{v.rightHeaderLabel}</span>
        <span style={{ font: '600 11px ui-monospace,monospace', color: '#98A2AA' }}>{v.shareHintLabel}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 20px', minHeight: 0 }}>
        {/* score */}
        <div style={{ background: '#fff', border: '1px solid #E6EAE8', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flexShrink: 0, font: "800 34px/1 'Pretendard'", color: '#14584A', letterSpacing: '-.02em' }}>
              {sc.value}
              <span style={{ fontSize: 14, fontWeight: 700, color: '#98A2AA', marginLeft: 2 }}>/100</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "700 14px 'Pretendard'", color: '#1D242B' }}>{sc.label}</div>
              <div style={{ font: "600 11px 'Pretendard'", color: '#98A2AA', marginTop: 2 }}>{sc.sub}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {sc.crits.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ font: "700 12.5px 'Pretendard'", width: 84, flexShrink: 0, color: '#1D242B' }}>{c.name}</span>
                <span style={{ flex: 1, height: 7, borderRadius: 99, background: '#EAEEEC', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', borderRadius: 99, width: `${c.pct}%`, background: c.color }} />
                </span>
                <span style={{ font: '700 11px ui-monospace,monospace', color: '#5A636D', width: 30, textAlign: 'right', flexShrink: 0 }}>{c.scoreText}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14 }}>
            <button onClick={v.onAiEval} disabled={v.evalLoading} style={{ border: 'none', borderRadius: 9, padding: '8px 13px', font: "700 12.5px 'Pretendard'", cursor: v.evalLoading ? 'default' : 'pointer', background: '#14584A', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, opacity: v.evalLoading ? 0.85 : 1 }}>
              {v.evalLoading && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
              {v.aiEvalLabel}
            </button>
            <span style={{ font: "600 12px 'Pretendard'", color: '#98A2AA' }}>{v.evalStatus}</span>
          </div>
          {v.hasEval && (
            <div style={{ marginTop: 12, padding: '13px 14px', background: '#F5F8F6', border: '1px solid #E6EAE8', borderRadius: 11, animation: 'pop .16s ease' }}>
              <div style={{ font: "800 11px 'Pretendard'", color: '#14584A', marginBottom: 3 }}>{v.evalGoodLabel}</div>
              <div style={{ font: "500 13px/1.6 'Pretendard'", color: '#1D242B', marginBottom: 10 }}>{v.evalResult.good}</div>
              <div style={{ font: "800 11px 'Pretendard'", color: '#14584A', marginBottom: 3 }}>{v.evalImproveLabel}</div>
              <div style={{ font: "500 13px/1.6 'Pretendard'", color: '#1D242B', marginBottom: 10 }}>{v.evalResult.improve}</div>
              {(v.evalResult.before || v.evalResult.after) && (
                <>
                  <div style={{ font: "800 11px 'Pretendard'", color: '#14584A', marginBottom: 5 }}>{v.evalRewriteLabel}</div>
                  <div style={{ background: '#fff', borderLeft: '2px solid #14584A', borderRadius: 7, padding: '8px 11px', font: "500 12.5px/1.6 'Pretendard'" }}>
                    <span style={{ color: '#98A2AA' }}>{v.beforeLabel}</span> {v.evalResult.before}
                    <br />
                    <span style={{ color: '#14584A', fontWeight: 700 }}>{v.afterLabel}</span> {v.evalResult.after}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* trend */}
        {v.trend.show && (
          <div style={{ background: '#fff', border: '1px solid #E6EAE8', borderRadius: 14, padding: '15px 16px', marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ font: "800 13px 'Pretendard'" }}>{v.trend.title}</span>
              <span style={{ font: '700 11px ui-monospace,monospace', color: '#5A636D' }}>{v.trend.stat}</span>
            </div>
            <svg viewBox="0 0 300 96" width="100%" style={{ display: 'block' }}>
              <line x1="20" y1="14" x2="292" y2="14" stroke="#EAEEEC" strokeWidth="1" />
              <line x1="20" y1="50" x2="292" y2="50" stroke="#EAEEEC" strokeWidth="1" />
              <line x1="20" y1="82" x2="292" y2="82" stroke="#EAEEEC" strokeWidth="1" />
              {v.trend.areaD && <path d={v.trend.areaD} fill="#14584A" opacity="0.10" />}
              <path d={v.trend.lineD} fill="none" stroke="#14584A" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
              {v.trend.dots.map((d: { cx: string; cy: string }, i: number) => (
                <circle key={i} cx={d.cx} cy={d.cy} r="3.4" fill="#14584A" />
              ))}
            </svg>
            <div style={{ font: "600 12px/1.5 'Pretendard'", color: '#5A636D', marginTop: 8 }}>{v.trend.note}</div>
          </div>
        )}

        {/* summary */}
        <div style={{ background: '#fff', border: '1px solid #E6EAE8', borderRadius: 14, padding: 16, marginTop: 14 }}>
          <div style={{ font: "800 13px 'Pretendard'", marginBottom: 13 }}>{v.summaryTitleLabel}</div>
          {v.isEmpty && (
            <div style={{ textAlign: 'center', color: '#98A2AA', font: "500 13px 'Pretendard'", padding: '24px 8px' }}>{v.emptySummaryLabel}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {v.summary.map((g: any) => (
              <div key={g.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ font: "800 12.5px 'Pretendard'", padding: '1px 4px', color: g.fg, background: g.markBg }}>{g.label}</span>
                  <span style={{ font: '700 10px ui-monospace,monospace', color: '#98A2AA' }}>{g.count}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {g.items.map((it: any) => (
                    <div key={it.id} style={{ font: "500 13.5px/1.5 'Pretendard'", paddingLeft: 15, position: 'relative', color: '#1D242B' }}>
                      <span style={{ position: 'absolute', left: 2, top: 8, width: 5, height: 5, borderRadius: '50%', background: g.dot }} />
                      {it.text}
                      {it.hasOwner && <span style={{ font: '700 11px ui-monospace,monospace', color: '#14584A', marginLeft: 6 }}>@{it.owner}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* export */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={v.onExportNotion} style={{ flex: 1, border: 'none', borderRadius: 10, padding: 10, font: "700 12.5px 'Pretendard'", cursor: 'pointer', background: '#14584A', color: '#fff' }}>{v.expNotionLabel}</button>
            <button onClick={v.onExportMd} style={{ border: '1.5px solid #CFD6D2', borderRadius: 10, padding: '10px 13px', font: "700 12.5px 'Pretendard'", cursor: 'pointer', background: '#fff', color: '#5A636D' }}>{v.expMdLabel}</button>
            <button onClick={v.onExportCopy} style={{ border: '1.5px solid #CFD6D2', borderRadius: 10, padding: '10px 13px', font: "700 12.5px 'Pretendard'", cursor: 'pointer', background: '#fff', color: '#5A636D' }}>{v.expCopyLabel}</button>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '2px 2px 0' }}>
            <button onClick={v.onExportObsidian} style={{ border: 'none', background: 'transparent', color: '#5A636D', font: "700 12px 'Pretendard'", cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>{v.expObsidianLabel}</button>
            <E
              tag="button"
              onClick={v.onDeleteNote}
              s="margin-left:auto;border:none;background:transparent;color:#98A2AA;font:700 12px 'Pretendard';cursor:pointer;text-decoration:underline;padding:0"
              hov="color:#c0392b"
            >
              {v.delNoteLabel}
            </E>
          </div>
        </div>
      </div>
    </div>
  )
}

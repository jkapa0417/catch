import { useApp } from './state/useApp'
import Sidebar from './components/Sidebar'
import Capture from './components/Capture'
import RightPanel from './components/RightPanel'
import SettingsModal from './components/SettingsModal'
import ContextMenu from './components/ContextMenu'

export default function App() {
  const v = useApp()

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* titlebar (frameless window — drag region + working traffic lights) */}
      <div
        className="drag"
        style={{ height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 18px', background: 'linear-gradient(180deg,#fbfcfc,#f1f4f3)', borderBottom: '1px solid #E6EAE8' }}
      >
        <div className="no-drag" style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <button
            onClick={() => window.catch.winClose()}
            title="Close"
            aria-label="Close"
            style={{ width: 13, height: 13, padding: 0, border: 'none', borderRadius: '50%', background: '#ff5f57', boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.12)', cursor: 'pointer' }}
          />
          <button
            onClick={() => window.catch.winMinimize()}
            title="Minimize"
            aria-label="Minimize"
            style={{ width: 13, height: 13, padding: 0, border: 'none', borderRadius: '50%', background: '#febc2e', boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.12)', cursor: 'pointer' }}
          />
          <button
            onClick={() => window.catch.winToggleMaximize()}
            title="Zoom"
            aria-label="Zoom"
            style={{ width: 13, height: 13, padding: 0, border: 'none', borderRadius: '50%', background: '#28c840', boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.12)', cursor: 'pointer' }}
          />
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5A636D', letterSpacing: '-.01em' }}>{v.titlebarText}</div>
        {v.updPill && (
          <button
            className="no-drag"
            onClick={() => (v.updPill!.action === 'install' ? v.onInstallUpdate() : v.updPill!.action === 'download' ? v.onDownloadUpdate() : undefined)}
            disabled={!v.updPill.action}
            title={v.updPill.text}
            style={{ marginRight: 9, border: 'none', background: '#14584A', color: '#fff', borderRadius: 99, padding: '5px 12px', font: "700 11px 'Pretendard'", cursor: v.updPill.action ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5FD0A6' }} />
            {v.updPill.text}
          </button>
        )}
        <div className="no-drag" style={{ font: '700 11px ui-monospace,Menlo,monospace', color: '#5A636D', background: '#fff', border: '1px solid #E6EAE8', borderRadius: 99, padding: '5px 12px' }}>{v.muscle.streakText}</div>
      </div>

      {/* body : 3 columns */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar v={v} />
        <Capture v={v} />
        <RightPanel v={v} />
      </div>

      <SettingsModal v={v} />
      <ContextMenu menu={v.menu} onClose={v.onCloseMenu} />

      {/* toast */}
      {v.toast.show && (
        <div style={{ position: 'fixed', left: '50%', bottom: 30, transform: 'translateX(-50%)', background: '#1D242B', color: '#fff', padding: '11px 20px', borderRadius: 11, font: "600 13px 'Pretendard'", zIndex: 80, boxShadow: '0 10px 30px rgba(0,0,0,.25)', animation: 'toastin .25s ease' }}>
          {v.toast.msg}
        </div>
      )}
    </div>
  )
}

import type { CSSProperties } from 'react'
import type { Provider } from '@shared/types'
import { E } from './El'
import type { Vals } from '../state/useApp'

const fieldLabel: CSSProperties = {
  display: 'block',
  marginTop: 14,
  font: '700 10px ui-monospace,monospace',
  letterSpacing: '.06em',
  color: '#98A2AA',
  textTransform: 'uppercase'
}

export default function SettingsModal({ v }: { v: Vals }) {
  if (!v.settingsOpen) return null
  return (
    <div
      style={{ position: 'absolute', inset: 0, background: 'rgba(16,30,26,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, animation: 'fade .14s ease' }}
      onClick={v.onCloseSettings}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxHeight: 760, overflowY: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 30px 70px -16px rgba(20,40,34,.5)', animation: 'pop .16s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #E6EAE8' }}>
          <span style={{ font: "800 18px 'Pretendard'", letterSpacing: '-.01em' }}>{v.setTitleLabel}</span>
          <button onClick={v.onCloseSettings} style={{ border: 'none', background: '#F1F4F3', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#5A636D', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '22px 24px 8px' }}>
          <div style={{ font: "800 13px 'Pretendard'", color: '#1D242B' }}>{v.setAiLabel}</div>
          <div style={{ font: "500 12px/1.5 'Pretendard'", color: '#98A2AA', marginTop: 3, marginBottom: 13 }}>{v.setAiDescLabel}</div>

          <label style={{ font: '700 10px ui-monospace,monospace', letterSpacing: '.06em', color: '#98A2AA', textTransform: 'uppercase' }}>{v.setProviderLabel}</label>
          <select
            data-testid="provider-select"
            value={v.provider}
            onChange={(e) => v.onProviderChange(e.target.value as Provider)}
            style={{ width: '100%', marginTop: 6, border: '1.5px solid #CFD6D2', borderRadius: 11, padding: '11px 12px', font: "600 14px 'Pretendard'", color: '#1D242B', background: '#fff', outline: 'none', cursor: 'pointer' }}
          >
            {v.providerList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {v.showBaseUrl && (
            <>
              <label style={fieldLabel}>{v.setBaseUrlLabel}</label>
              <E
                tag="input"
                value={v.baseUrlValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => v.onBaseUrlInput(e.target.value)}
                type="text"
                placeholder={v.setBaseUrlPh}
                s="width:100%;margin-top:6px;border:1.5px solid #CFD6D2;border-radius:11px;padding:11px 12px;font:600 13px ui-monospace,monospace;color:#1D242B;background:#fff;outline:none"
                foc="border:1.5px solid #14584A"
              />
            </>
          )}

          {v.showModel && (
            <>
              <label style={fieldLabel}>{v.setModelLabel}</label>
              <E
                tag="input"
                value={v.modelValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => v.onModelInput(e.target.value)}
                type="text"
                placeholder={v.modelPh}
                s="width:100%;margin-top:6px;border:1.5px solid #CFD6D2;border-radius:11px;padding:11px 12px;font:600 13px ui-monospace,monospace;color:#1D242B;background:#fff;outline:none"
                foc="border:1.5px solid #14584A"
              />
              <div style={{ font: "500 11px 'Pretendard'", color: '#98A2AA', marginTop: 5 }}>{v.setModelHint}</div>
            </>
          )}

          {v.showKey && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
                <label style={{ font: '700 10px ui-monospace,monospace', letterSpacing: '.06em', color: '#98A2AA', textTransform: 'uppercase' }}>{v.setKeyLabel}</label>
                {v.providerDocs && (
                  <button
                    onClick={() => window.open(v.providerDocs, '_blank')}
                    style={{ border: 'none', background: 'transparent', color: '#14584A', font: "700 11px 'Pretendard'", cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    {v.getKeyLabel} ↗
                  </button>
                )}
              </div>
              <E
                tag="input"
                value={v.apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => v.onKeyInput(e.target.value)}
                type="password"
                placeholder={v.setKeyPh}
                s="width:100%;margin-top:6px;border:1.5px solid #CFD6D2;border-radius:11px;padding:11px 12px;font:600 14px ui-monospace,monospace;color:#1D242B;background:#fff;outline:none"
                foc="border:1.5px solid #14584A"
              />
            </>
          )}

          <button
            onClick={v.onConnect}
            disabled={v.verifying}
            style={{ width: '100%', marginTop: 12, border: 'none', borderRadius: 11, padding: '11px 12px', font: "700 13px 'Pretendard'", cursor: v.verifying ? 'default' : 'pointer', background: '#14584A', color: '#fff', opacity: v.verifying ? 0.85 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            {v.verifying && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
            {v.setConnectLabel}
          </button>
          {v.connected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, font: "700 12px 'Pretendard'", color: '#0f6a4c', background: '#D4EFE3', borderRadius: 9, padding: '9px 12px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1B9C72' }} />
              {v.connectedText}
            </div>
          )}
        </div>

        {/* exports / integrations */}
        <div style={{ padding: '18px 24px 8px', borderTop: '1px solid #E6EAE8', marginTop: 18 }}>
          <div style={{ font: "800 13px 'Pretendard'", color: '#1D242B' }}>{v.setIntegrationsLabel}</div>
          <div style={{ font: "500 12px/1.5 'Pretendard'", color: '#98A2AA', marginTop: 3, marginBottom: 12 }}>{v.setIntegrationsDescLabel}</div>

          <div style={{ font: "700 12px 'Pretendard'", color: '#1D242B' }}>{v.notionSectionLabel}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
            <label style={{ font: '700 10px ui-monospace,monospace', letterSpacing: '.06em', color: '#98A2AA', textTransform: 'uppercase' }}>{v.notionTokenLabel}</label>
            <button
              onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
              style={{ border: 'none', background: 'transparent', color: '#14584A', font: "700 11px 'Pretendard'", cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              {v.getKeyLabel} ↗
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <E
              tag="input"
              value={v.notionToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => v.onNotionTokenInput(e.target.value)}
              type="password"
              placeholder={v.notionTokenPh}
              s="flex:1;border:1.5px solid #CFD6D2;border-radius:11px;padding:11px 12px;font:600 14px ui-monospace,monospace;color:#1D242B;background:#fff;outline:none"
              foc="border:1.5px solid #14584A"
            />
            <button onClick={v.onSaveNotion} style={{ border: 'none', borderRadius: 11, padding: '0 18px', font: "700 13px 'Pretendard'", cursor: 'pointer', background: '#14584A', color: '#fff', flexShrink: 0 }}>{v.saveLabel}</button>
          </div>
          {v.notionConnected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, font: "700 12px 'Pretendard'", color: '#0f6a4c', background: '#D4EFE3', borderRadius: 9, padding: '8px 12px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1B9C72' }} />
              {v.notionConnectedText}
            </div>
          )}
          <label style={fieldLabel}>{v.notionParentLabel}</label>
          <E
            tag="input"
            value={v.notionParentValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => v.onNotionParentInput(e.target.value)}
            type="text"
            placeholder={v.notionParentPh}
            s="width:100%;margin-top:6px;border:1.5px solid #CFD6D2;border-radius:11px;padding:11px 12px;font:600 13px ui-monospace,monospace;color:#1D242B;background:#fff;outline:none"
            foc="border:1.5px solid #14584A"
          />

          <div style={{ font: "700 12px 'Pretendard'", color: '#1D242B', marginTop: 18 }}>{v.obsidianSectionLabel}</div>
          <label style={fieldLabel}>{v.obsidianVaultLabel}</label>
          <E
            tag="input"
            value={v.obsidianVaultValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => v.onObsidianVaultInput(e.target.value)}
            type="text"
            placeholder={v.obsidianVaultPh}
            s="width:100%;margin-top:6px;border:1.5px solid #CFD6D2;border-radius:11px;padding:11px 12px;font:600 14px 'Pretendard';color:#1D242B;background:#fff;outline:none"
            foc="border:1.5px solid #14584A"
          />
        </div>

        <div style={{ padding: '18px 24px 24px', borderTop: '1px solid #E6EAE8', marginTop: 18 }}>
          <div style={{ font: "800 13px 'Pretendard'", color: '#1D242B', marginBottom: 11 }}>{v.setLangLabel}</div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={v.onLangKo} style={{ flex: 1, border: `1.5px solid ${v.langKoBorder}`, background: v.langKoBg, color: v.langKoFg, borderRadius: 11, padding: 12, font: "700 14px 'Pretendard'", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {v.isKo && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#14584A' }} />}한국어
            </button>
            <button onClick={v.onLangEn} style={{ flex: 1, border: `1.5px solid ${v.langEnBorder}`, background: v.langEnBg, color: v.langEnFg, borderRadius: 11, padding: 12, font: "700 14px 'Pretendard'", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {v.isEn && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#14584A' }} />}English
            </button>
          </div>
        </div>

        <div style={{ padding: '0 24px 22px' }}>
          <button onClick={v.onCloseSettings} style={{ width: '100%', border: 'none', borderRadius: 11, padding: 13, font: "800 14px 'Pretendard'", cursor: 'pointer', background: '#1D242B', color: '#fff' }}>{v.doneLabel}</button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface MenuItem {
  label?: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
  /** Non-interactive muted section label. */
  header?: boolean
  /** Optional leading swatch color (e.g. a note-mode accent). */
  dot?: string
  submenu?: MenuItem[]
}

export interface MenuState {
  x: number
  y: number
  items: MenuItem[]
}

const MENU_W = 188

function MenuList({
  items,
  x,
  y,
  onClose
}: {
  items: MenuItem[]
  x: number
  y: number
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })
  const [openSub, setOpenSub] = useState<number | null>(null)

  // Keep the menu fully on-screen.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let nx = x
    let ny = y
    if (x + r.width > window.innerWidth) nx = Math.max(6, window.innerWidth - r.width - 6)
    if (y + r.height > window.innerHeight) ny = Math.max(6, window.innerHeight - r.height - 6)
    setPos({ x: nx, y: ny })
  }, [x, y])

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        minWidth: MENU_W,
        background: '#fff',
        border: '1px solid #E6EAE8',
        borderRadius: 10,
        boxShadow: '0 14px 36px -10px rgba(20,40,34,.45)',
        padding: 5,
        zIndex: 200,
        animation: 'pop .12s ease',
        fontFamily: 'Pretendard, sans-serif'
      }}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} style={{ height: 1, background: '#EEF1EF', margin: '5px 6px' }} />
        ) : it.header ? (
          <div
            key={i}
            style={{
              font: '700 10px ui-monospace,monospace',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: '#98A2AA',
              padding: '6px 10px 4px'
            }}
          >
            {it.label}
          </div>
        ) : (
          <Row key={i} item={it} index={i} openSub={openSub} setOpenSub={setOpenSub} onClose={onClose} />
        )
      )}
    </div>
  )
}

function Row({
  item,
  index,
  openSub,
  setOpenSub,
  onClose
}: {
  item: MenuItem
  index: number
  openSub: number | null
  setOpenSub: (i: number | null) => void
  onClose: () => void
}) {
  const [hover, setHover] = useState(false)
  const rowRef = useRef<HTMLButtonElement>(null)
  const hasSub = !!item.submenu && item.submenu.length > 0
  const disabled = item.disabled
  const color = disabled ? '#C0C8CC' : item.danger ? '#c0392b' : '#1D242B'

  const sub =
    hasSub && openSub === index && rowRef.current
      ? (() => {
          const r = rowRef.current!.getBoundingClientRect()
          return <MenuList items={item.submenu!} x={r.right - 4} y={r.top - 5} onClose={onClose} />
        })()
      : null

  return (
    <>
      <button
        ref={rowRef}
        disabled={disabled}
        onMouseEnter={() => {
          setHover(true)
          setOpenSub(hasSub ? index : null)
        }}
        onMouseLeave={() => setHover(false)}
        onClick={() => {
          if (disabled) return
          if (hasSub) {
            setOpenSub(openSub === index ? null : index)
            return
          }
          item.onClick?.()
          onClose()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          textAlign: 'left',
          border: 'none',
          background: hover && !disabled ? '#EEF3F1' : 'transparent',
          color,
          cursor: disabled ? 'default' : 'pointer',
          font: "600 13px 'Pretendard'",
          padding: '8px 10px',
          borderRadius: 7
        }}
      >
        {item.dot && (
          <span style={{ width: 8, height: 8, borderRadius: 2, background: item.dot, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1 }}>{item.label}</span>
        {hasSub && (
          <span style={{ color: '#98A2AA', fontSize: 11, lineHeight: 1 }}>▶</span>
        )}
      </button>
      {sub}
    </>
  )
}

export default function ContextMenu({ menu, onClose }: { menu: MenuState | null; onClose: () => void }) {
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu, onClose])

  if (!menu) return null
  return (
    <div
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault()
        onClose()
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 190 }}
    >
      <MenuList items={menu.items} x={menu.x} y={menu.y} onClose={onClose} />
    </div>
  )
}

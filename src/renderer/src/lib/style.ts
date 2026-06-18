import { CSSProperties, useMemo, useState } from 'react'

/**
 * Convert a CSS string ("display:flex;gap:9px") into a React style object so the
 * design's inline styles can be ported near-verbatim. kebab-case keys are
 * camelCased; vendor-prefixed keys (-webkit-…) become Webkit… as React expects.
 */
export function parseStyle(css?: string): CSSProperties {
  if (!css) return {}
  const out: Record<string, string> = {}
  for (const decl of css.split(';')) {
    const idx = decl.indexOf(':')
    if (idx < 0) continue
    const prop = decl.slice(0, idx).trim()
    const value = decl.slice(idx + 1).trim()
    if (!prop) continue
    out[toCamel(prop)] = value
  }
  return out as CSSProperties
}

function toCamel(prop: string): string {
  // -webkit-font-smoothing -> WebkitFontSmoothing ; background-clip -> backgroundClip
  return prop
    .replace(/^-(webkit|moz|ms|o)-/, (_m, v) => v.charAt(0).toUpperCase() + v.slice(1) + '-')
    .replace(/-([a-z])/g, (_m, c) => c.toUpperCase())
}

/** Merge several CSS strings / style objects (later wins). */
export function sx(...parts: Array<string | CSSProperties | undefined | false>): CSSProperties {
  let merged: CSSProperties = {}
  for (const p of parts) {
    if (!p) continue
    merged = { ...merged, ...(typeof p === 'string' ? parseStyle(p) : p) }
  }
  return merged
}

/**
 * Hook that returns interaction state + handlers for an element that swaps
 * style on hover and/or focus (the design's style-hover / style-focus).
 */
export function useInteractive(hover?: string, focus?: string) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const handlers = useMemo(
    () => ({
      ...(hover
        ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
        : {}),
      ...(focus
        ? { onFocus: () => setFocused(true), onBlur: () => setFocused(false) }
        : {})
    }),
    [hover, focus]
  )
  const extra = sx(hovered ? hover : undefined, focused ? focus : undefined)
  return { handlers, extra }
}

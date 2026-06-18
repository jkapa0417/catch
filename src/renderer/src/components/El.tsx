import { createElement, CSSProperties, forwardRef, ReactNode } from 'react'
import { sx, useInteractive } from '../lib/style'

type Tag = keyof JSX.IntrinsicElements

interface ElProps {
  tag?: Tag
  /** CSS string, ported verbatim from the design. */
  s?: string
  /** Extra style swapped in on hover (style-hover). */
  hov?: string
  /** Extra style swapped in on focus (style-focus). */
  foc?: string
  /** Object overrides merged last. */
  style?: CSSProperties
  children?: ReactNode
  [key: string]: any
}

/**
 * Polymorphic styled element. Lets the design's markup port across nearly 1:1:
 *   <E tag="button" s="..." hov="..." onClick={...}>…</E>
 */
export const E = forwardRef<HTMLElement, ElProps>(function E(
  { tag = 'div', s, hov, foc, style, children, ...rest },
  ref
) {
  const { handlers, extra } = useInteractive(hov, foc)
  return createElement(
    tag as string,
    { ref, style: sx(s, extra, style), ...handlers, ...rest },
    children
  )
})

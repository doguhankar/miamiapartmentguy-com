import type { CSSProperties } from 'react'

export const DEAL_PINK = '#FF2D7E'

export function DealBadge({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        position: 'absolute',
        zIndex: 3,
        maxWidth: '70%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        background: DEAL_PINK,
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        padding: '6px 10px',
        borderRadius: 999,
        boxShadow: '0 2px 6px rgba(10,15,28,0.22)',
        ...style,
      }}
    >
      {label}
    </span>
  )
}

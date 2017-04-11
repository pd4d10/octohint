import * as React from 'react'

export interface QuickInfoBackgroundProps {
  isVisible: boolean,
  top: number,
  left: number,
}

const QuickInfoBackground = (props: QuickInfoBackgroundProps) => (
  <div
    style={{
      display: props.isVisible ? 'block' : 'none',
      position: 'absolute',
      zIndex: -1,
      background: 'rgba(173,214,255,.15)',
      // lineHeight: '20px',
      // FIXME: Get line height from actual DOM
      top: props.top,
      left: props.left,
    }}
  />
)

export default QuickInfoBackground

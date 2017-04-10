import * as React from 'react'

export interface QuickInfoProps {
  isVisible: boolean,
  info: string,
  top: number,
  left: number,
}

const QuickInfo = (props: QuickInfoProps) => (
  <div
    style={{
      display: props.isVisible ? 'block' : 'none',
      position: 'absolute',
      top: `${props.top}px`,
      left: `${props.left}px`
    }}
  >
    <div
      style={{
        position: 'absolute',
        background: 'rgba(173,214,255,.15)',
        // lineHeight: '20px',
        // FIXME: Get line height from actual DOM
        top: 0,
        left: 0
      }}
    />
    <div
      style={{
        position: 'absolute',
        background: '#eee',
        border: '1px solid #aaa',
        fontSize: '12px',
        padding: '4px',
        lineHeight: 1,
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
        // FIXME: Get font family from actual DOM
        top: '-22px',
        left: 0,
      }}
    >{props.info}</div>
  </div>
)

export default QuickInfo

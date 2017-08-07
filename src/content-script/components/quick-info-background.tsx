import { h } from 'preact'

export interface QuickInfoBackgroundProps {
  isVisible: boolean
  top: number
  left: number
  width: number
  height: number
}

const QuickInfoBackground = (props: QuickInfoBackgroundProps) =>
  <div
    style={{
      display: props.isVisible ? 'block' : 'none',
      position: 'absolute',
      background: 'rgba(173,214,255,.3)',
      // lineHeight: '20px',
      top: props.top,
      left: props.left,
      width: props.width,
      height: props.height,
    }}
  />

export default QuickInfoBackground

import { h } from 'preact'
import { colors } from '../constants'

export interface QuickInfoBackgroundProps {
  visible: boolean
  top: number
  left: number
  width: number
  height: number
}

const QuickInfoBackground = (props: QuickInfoBackgroundProps) => (
  <div
    style={{
      display: props.visible ? 'block' : 'none',
      position: 'absolute',
      background: colors.quickInfoBackground,
      // lineHeight: '20px',
      top: props.top,
      left: props.left,
      width: props.width,
      height: props.height,
    }}
  />
)

export default QuickInfoBackground

import { h } from 'preact'
import { colors } from '../../utils'

export interface QuickInfoBackgroundProps {
  isVisible: boolean
  top: number
  left: number
  width: number
  height: number
}

const QuickInfoBackground = (props: QuickInfoBackgroundProps) => (
  <div
    style={{
      display: props.isVisible ? 'block' : 'none',
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

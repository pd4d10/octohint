import { h } from 'preact'
import { colors } from '../constants'

export interface OccurrenceProps {
  isWriteAccess: boolean
  width: number
  height: number
  top: number
  left: number
}

const Occurrence = (props: OccurrenceProps) => (
  <div
    style={{
      position: 'absolute',
      background: props.isWriteAccess ? colors.occurrenceWrite : colors.occurrenceRead,
      width: props.width,
      height: props.height,
      top: props.top,
      left: props.left,
    }}
  />
)

export default Occurrence

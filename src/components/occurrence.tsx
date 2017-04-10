import * as React from 'react'

export interface OccurrenceProps {
  isWriteAccess: boolean,
  width: number,
  height: number,
  top: number,
  left: number,
}

const Occurrence = (props: OccurrenceProps) => (
  <div
    style={{
      position: 'absolute',
      background: props.isWriteAccess ? 'rgba(14,99,156,.25)' : 'rgba(173,214,255,.3)',
      width: props.width,
      height: props.height,
      top: props.top,
      left: props.left
    }}
  />
)

export default Occurrence

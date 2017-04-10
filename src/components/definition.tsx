import * as React from 'react'

export interface DefinitionProps {
  isVisible: boolean,
  height: number,
  width: number,
  top: number,
}

const Definition = (props: DefinitionProps) => (
  <div
    style={{
      display: props.isVisible ? 'block' : 'none',
      position: 'absolute',
      background: 'rgb(248, 238, 199)',
      left: 0,
      width: `${props.width}px`,
      height: `${props.height}px`,
      top: `${props.top}px`
    }}
  />
)

export default Definition

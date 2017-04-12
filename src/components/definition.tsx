import { h } from 'preact'

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
      width: props.width,
      height: props.height,
      top: props.top
    }}
  />
)

export default Definition

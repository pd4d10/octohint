import { h, Component } from 'preact'

export interface StateType {
  isVisible: boolean
  info: string
  left: number
  fontFamily: string
  line: number
  height: number
}

export default class QuickInfo extends Component<{ ref: (ref: any) => any }, StateType> {
  state = {
    isVisible: false,
    info: '',
    left: 0,
    fontFamily: 'monospace',
    fontWidth: 0,
    line: 0,
    height: 0,
  }

  render() {
    const { state } = this
    const padding = 4
    const border = 1
    // https://stackoverflow.com/questions/28680940/text-is-breaking-using-absolute-positioning
    // After applying `position: absolute`, words always break to next line
    // `white-space: no-wrap` could only handle short case
    // So we calculate it mannualy
    let width = state.fontWidth * state.info.length + 2 * padding + 2 * border + 2
    if (width > 300) {
      width = 300
    }

    // TODO: Show info according to height
    // For line 0 and 1, show info below
    const positionStyle = {}
    if (state.line === 0 || state.line === 1) {
      positionStyle.top = (state.line + 1) * state.height
    } else {
      positionStyle.bottom = 0 - state.line * state.height
    }

    return (
      <div
        style={{
          display: state.isVisible ? 'block' : 'none',
          position: 'absolute',
          background: '#eee',
          border: `${border}px solid #aaa`,
          fontSize: '12px',
          padding: `2px ${padding}px`,
          fontFamily: state.fontFamily,
          left: state.left,
          width,
          ...positionStyle,
        }}
      >
        {state.info}
      </div>
    )
  }
}

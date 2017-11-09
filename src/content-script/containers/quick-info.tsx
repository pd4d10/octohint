import { h, Component } from 'preact'
import { SymbolDisplayPart } from 'typescript'

export interface StateType {
  isVisible: boolean
  info: SymbolDisplayPart[] | string
  left: number
  fontFamily: string
  line: number
  height: number
}

function getColorFromKind(kind: string) {
  switch (kind) {
    case 'keyword':
      return '#00f'
    case 'punctuation':
      return '#000'
    default:
      return '#001080'
  }
}

export default class QuickInfo extends Component<{ ref: (ref: any) => any }, StateType> {
  state: StateType = {
    isVisible: false,
    info: [],
    left: 0,
    fontFamily: 'monospace', // TODO: Use the same font family
    line: 0,
    height: 0,
  }

  render() {
    const { state } = this
    const padding = 4
    const border = 1

    // TODO: Fix https://github.com/Microsoft/TypeScript/blob/master/Gulpfile.ts
    // TODO: Show info according to height
    // TODO: Make quick info could be copied
    // For line 0 and 1, show info below
    const positionStyle: { top?: number; bottom?: number } = {}
    if (state.line < 2) {
      positionStyle.top = (state.line + 1) * state.height
    } else {
      positionStyle.bottom = 0 - state.line * state.height
    }

    return (
      <div
        style={{
          display: state.isVisible ? 'block' : 'none',
          whiteSpace: 'pre-wrap',
          position: 'absolute',
          background: '#efeff2',
          border: `${border}px solid #c8c8c8`,
          fontSize: '12px',
          padding: `2px ${padding}px`,
          fontFamily: state.fontFamily,
          left: state.left,
          maxWidth: '500px',
          maxHeight: '300px',
          overflow: 'auto',
          wordBreak: 'break-all',
          ...positionStyle,
        }}
      >
        <div>
          {Array.isArray(state.info) ? (
            state.info.map(part => {
              if (part.text === '\n') {
                return <br />
              }
              return <span style={{ color: getColorFromKind(part.kind) }}>{part.text}</span>
            })
          ) : (
            state.info.replace(/\\/g, '')
            // JSON.parse(`"${state.info}"`)
          )}
        </div>
      </div>
    )
  }
}

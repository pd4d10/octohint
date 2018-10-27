import { h, Component } from 'preact'
import { SymbolDisplayPart } from 'typescript'

export type QuickInfoState = {
  visible: boolean
  info: SymbolDisplayPart[] | string
  left: number
  fontFamily: string
  fontSize: number | string
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

export default class QuickInfo extends Component<{ ref: (ref: any) => any }, QuickInfoState> {
  state: QuickInfoState = {
    visible: false,
    info: [],
    left: 0,
    fontFamily: 'monospace',
    fontSize: 12,
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
    // For line 0 and 1, show info below, this is tricky
    // To support horizontal scroll, our root DOM must be inside $('.blob-wrapper')
    // So quick info can't show outside $('.blob-wrapper')
    const positionStyle: { top?: number; bottom?: number } = {}
    if (state.line < 2) {
      positionStyle.top = (state.line + 1) * state.height
    } else {
      positionStyle.bottom = 0 - state.line * state.height
    }

    return (
      <div
        style={{
          display: state.visible ? 'block' : 'none',
          whiteSpace: 'pre-wrap',
          position: 'absolute',
          background: '#efeff2',
          border: `${border}px solid #c8c8c8`,
          fontSize: state.fontSize,
          padding: `2px ${padding}px`,
          fontFamily: state.fontFamily,
          left: state.left,
          maxWidth: 500,
          maxHeight: 300,
          overflow: 'auto',
          wordBreak: 'break-all',
          ...positionStyle,
        }}
      >
        <div>
          {Array.isArray(state.info)
            ? state.info.map(part => {
                if (part.text === '\n') {
                  return <br />
                }
                return <span style={{ color: getColorFromKind(part.kind) }}>{part.text}</span>
              })
            : state.info.replace(/\\/g, '')
          // JSON.parse(`"${state.info}"`)
          }
        </div>
      </div>
    )
  }
}

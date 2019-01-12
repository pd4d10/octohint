import { h, Component } from 'preact'
import Portal from 'preact-portal'
import { debounce } from 'lodash-es'
import {
  Definition,
  Occurrence,
  QuickInfo,
  BackgroundMessageOfOccurrence,
  Message,
  BackgroundMessageOfQuickInfo,
} from '../types'

const colors = {
  lineBg: '#fffbdd',
  quickInfoBackground: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}

const DEBOUNCE_TIMEOUT = 300
const isMacOS = /Mac OS X/i.test(navigator.userAgent)

interface AppState {
  occurrences: Occurrence[]
  definition?: Definition
  quickInfo?: QuickInfo
}

export default class App extends Component<any, AppState> {
  state: AppState = {
    occurrences: [],
  }

  $container: HTMLElement

  constructor(props: any) {
    super(props)
    this.$container = props.$container
  }

  getPosition(e: MouseEvent) {
    const rect = this.props.$background.getBoundingClientRect()
    return {
      // Must be integers, so use Math.floor
      x: Math.floor((e.clientX - rect.left) / this.props.fontWidth),
      y: Math.floor((e.clientY - rect.top) / this.props.line.height),
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', e => {
      console.log('keydown', e)
      if (isMacOS ? e.key === 'Meta' : e.key === 'Control') {
        // FIXME: Slow when file is large
        this.$container.style.cursor = 'pointer'
        // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
        setTimeout(() => (this.$container.style.cursor = null), 10000)
      }
    })
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      console.log('keyup', e)
      if (isMacOS ? e.key === 'Meta' : e.key === 'Control') {
        this.$container.style.cursor = null
      }
    })

    this.$container.addEventListener('click', this.handleClick)
    this.$container.addEventListener('mousemove', this.handleMouseMove)
    this.$container.addEventListener('mouseout', e => {
      this.setState({ quickInfo: undefined })
    })
  }

  handleClick = (e: MouseEvent) => {
    console.log('click', e)

    const position = this.getPosition(e)
    if (position.x < 0 || position.y < 0) {
      return
    }

    this.props.sendMessage(
      {
        file: this.props.fileName,
        type: Message.occurrence,
        position,
        meta: isMacOS ? e.metaKey : e.ctrlKey,
        codeUrl: this.props.codeUrl,
      },
      (response: BackgroundMessageOfOccurrence) => {
        if (response.info) {
          this.setState({ definition: response.info })
          window.scrollTo(
            0,
            this.props.offsetTop + this.props.padding.top + response.info.line * this.props.line.height - 80,
          ) // TODO: Magic number
        }

        // TODO: Fix overflow when length is large
        if (response.occurrences) {
          this.setState({ occurrences: response.occurrences })
        }
      },
    )

    // TODO: Exclude click event triggered by selecting text
    // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
    // if (window.getSelection().toString()) {
    //   return
    // }
  }

  handleMouseMove = debounce((e: MouseEvent) => {
    // console.log('mousemove', e)
    const position = this.getPosition(e)

    if (position.x < 0 || position.y < 0) {
      return
    }

    const params = {
      file: this.props.fileName,
      codeUrl: this.props.codeUrl,
      type: Message.quickInfo,
      position,
    }

    this.props.sendMessage(params, (response: BackgroundMessageOfQuickInfo) => {
      this.setState({ quickInfo: response.data })
    })
  }, DEBOUNCE_TIMEOUT)

  render() {
    const { state } = this

    return (
      <div>
        {state.definition && (
          <div
            style={{
              position: 'absolute',
              background: colors.lineBg,
              left: 0,
              width: this.props.line.width,
              height: this.props.line.height - 20, // TODO: Magic number
              top: state.definition.line * this.props.line.height,
            }}
          />
        )}
        {state.occurrences.map(occurrence => (
          <div
            style={{
              position: 'absolute',
              background: occurrence.isWriteAccess ? colors.occurrenceWrite : colors.occurrenceRead,
              width: occurrence.width * this.props.fontWidth,
              height: this.props.line.height,
              top: occurrence.range.line * this.props.line.height,
              left: occurrence.range.character * this.props.fontWidth,
            }}
          />
        ))}

        {state.quickInfo && (
          <div
            style={{
              position: 'absolute',
              background: colors.quickInfoBackground,
              // lineHeight: '20px',
              top: state.quickInfo.range.line * this.props.line.height,
              left: state.quickInfo.range.character * this.props.fontWidth,
              width: state.quickInfo.width * this.props.fontWidth,
              height: this.props.line.height,
            }}
          />
        )}
        {
          <Portal into={this.props.$quickInfo}>
            {state.quickInfo && state.quickInfo.info && (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  position: 'absolute',
                  backgroundColor: '#efeff2',
                  border: `1px solid #c8c8c8`,
                  fontSize: 12,
                  padding: `2px 4px`,
                  fontFamily: 'monospace',
                  left: state.quickInfo.range.character * this.props.fontWidth,
                  maxWidth: 500,
                  maxHeight: 300,
                  overflow: 'auto',
                  wordBreak: 'break-all',
                  ...(() => {
                    // TODO: Fix https://github.com/Microsoft/TypeScript/blob/master/Gulpfile.ts
                    // TODO: Show info according to height
                    // TODO: Make quick info could be copied
                    // For line 0 and 1, show info below, this is tricky
                    // To support horizontal scroll, our root DOM must be inside $('.blob-wrapper')
                    // So quick info can't show outside $('.blob-wrapper')
                    const positionStyle: { top?: number; bottom?: number } = {}
                    if (state.quickInfo.range.line < 2) {
                      positionStyle.top = (state.quickInfo.range.line + 1) * this.props.line.height
                    } else {
                      positionStyle.bottom = 0 - state.quickInfo.range.line * this.props.line.height
                    }

                    return positionStyle
                  })(),
                }}
              >
                {Array.isArray(state.quickInfo.info)
                  ? state.quickInfo.info.map(part => {
                      if (part.text === '\n') {
                        return <br />
                      }
                      return <span style={{ color: getColorFromKind(part.kind) }}>{part.text}</span>
                    })
                  : state.quickInfo.info.replace(/\\/g, '')
                // JSON.parse(`"${state.info}"`)
                }
              </div>
            )}
          </Portal>
        }
      </div>
    )
  }
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

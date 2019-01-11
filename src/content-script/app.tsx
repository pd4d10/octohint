import { h, Component } from 'preact'
import Portal from 'preact-portal'
import { SymbolDisplayPart } from 'typescript'
import { debounce } from 'lodash-es'
import * as types from '../types'

const colors = {
  lineBg: '#fffbdd',
  quickInfoBackground: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}

const DEBOUNCE_TIMEOUT = 300
const isMacOS = /Mac OS X/i.test(navigator.userAgent)

export default class App extends Component<any> {
  state = {
    occurrences: [] as {
      isWriteAccess: boolean
      width: number
      height: number
      top: number
      left: number
    }[],
    definition: {
      visible: false,
      height: 0,
      width: 0,
      top: 0,
    },
    quickInfo: {
      visible: false,
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      info: [] as SymbolDisplayPart[] | string,
      fontSize: 12,
      line: 0,
    },
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
      this.setState({ quickInfo: { visible: false } })
    })
  }

  handleClick = (e: MouseEvent) => {
    console.log('click', e)
    const nextState = {
      occurrences: [],
      definition: {
        visible: false,
      },
    }

    const position = this.getPosition(e)
    if (position.x < 0 || position.y < 0) {
      return
    }

    this.props.sendMessage(
      {
        file: this.props.fileName,
        type: types.Message.occurrence,
        position,
        meta: isMacOS ? e.metaKey : e.ctrlKey,
        codeUrl: this.props.codeUrl,
      },
      (response: types.BackgroundMessageOfOccurrence) => {
        if (response.info) {
          Object.assign(nextState, {
            definition: {
              visible: true,
              height: this.props.line.height,
              width: this.props.line.width - 20, // TODO: Magic number
              top: response.info.line * this.props.line.height,
            },
          })
          window.scrollTo(
            0,
            this.props.offsetTop + this.props.padding.top + response.info.line * this.props.line.height - 80,
          ) // TODO: Magic number
        }

        // TODO: Fix overflow when length is large
        if (response.occurrences) {
          const occurrences = response.occurrences.map(occurrence => ({
            height: this.props.line.height,
            width: occurrence.width * this.props.fontWidth,
            top: occurrence.range.line * this.props.line.height,
            left: occurrence.range.character * this.props.fontWidth,
            isWriteAccess: occurrence.isWriteAccess,
          }))
          Object.assign(nextState, { occurrences })
        }
        this.setState(nextState)
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
      type: types.Message.quickInfo,
      position,
    }

    this.props.sendMessage(params, (response: types.BackgroundMessageOfQuickInfo) => {
      const { data } = response
      if (data) {
        const { range } = data
        const top = range.line * this.props.line.height
        this.setState({
          quickInfo: {
            visible: true,
            info: data.info,
            top,
            line: range.line,
            left: range.character * this.props.fontWidth,
            height: this.props.line.height,
            fontFamily: this.props.fontFamily,
            fontWidth: this.props.fontWidth,
            fontSize: this.props.fontSize,
            width: data.width * this.props.fontWidth,
          },
        })
      } else {
        this.setState({
          quickInfo: {
            visible: false,
          },
        })
      }
    })
  }, DEBOUNCE_TIMEOUT)

  render() {
    const { state } = this

    // TODO: Fix https://github.com/Microsoft/TypeScript/blob/master/Gulpfile.ts
    // TODO: Show info according to height
    // TODO: Make quick info could be copied
    // For line 0 and 1, show info below, this is tricky
    // To support horizontal scroll, our root DOM must be inside $('.blob-wrapper')
    // So quick info can't show outside $('.blob-wrapper')
    const positionStyle: { top?: number; bottom?: number } = {}
    if (state.quickInfo.line < 2) {
      positionStyle.top = (state.quickInfo.line + 1) * state.quickInfo.height
    } else {
      positionStyle.bottom = 0 - state.quickInfo.line * state.quickInfo.height
    }

    return (
      <div>
        <div
          style={{
            display: state.definition.visible ? 'block' : 'none',
            position: 'absolute',
            background: colors.lineBg,
            left: 0,
            width: state.definition.width,
            height: state.definition.height,
            top: state.definition.top,
          }}
        />
        {state.occurrences.map(occurrence => (
          <div
            style={{
              position: 'absolute',
              background: occurrence.isWriteAccess ? colors.occurrenceWrite : colors.occurrenceRead,
              width: occurrence.width,
              height: occurrence.height,
              top: occurrence.top,
              left: occurrence.left,
            }}
          />
        ))}
        <div
          style={{
            display: state.quickInfo.visible ? 'block' : 'none',
            position: 'absolute',
            background: colors.quickInfoBackground,
            // lineHeight: '20px',
            top: state.quickInfo.top,
            left: state.quickInfo.left,
            width: state.quickInfo.width,
            height: state.quickInfo.height,
          }}
        />
        {
          <Portal into={this.props.$quickInfo}>
            {state.quickInfo.info && (
              <div
                style={{
                  display: state.quickInfo.visible ? 'block' : 'none',
                  whiteSpace: 'pre-wrap',
                  position: 'absolute',
                  background: '#efeff2',
                  border: `1px solid #c8c8c8`,
                  fontSize: state.quickInfo.fontSize,
                  padding: `2px 4px`,
                  fontFamily: 'monospace',
                  left: state.quickInfo.left,
                  maxWidth: 500,
                  maxHeight: 300,
                  overflow: 'auto',
                  wordBreak: 'break-all',
                  ...positionStyle,
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

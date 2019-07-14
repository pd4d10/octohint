import { h, Component } from 'preact'
import Portal from 'preact-portal'
import { debounce } from 'lodash-es'
import {
  Definition,
  Occurrence,
  QuickInfo,
  MessageType,
  BackgroundMessage,
  ContentMessage,
  BackgroundMessageOfOccurrence,
  BackgroundMessageOfQuickInfo,
} from '../types'

const colors = {
  lineBg: '#fffbdd',
  quickInfoBg: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}

const DEBOUNCE_TIMEOUT = 300
const isMacOS = /Mac OS X/i.test(navigator.userAgent)

interface AppProps {
  $background: HTMLElement
  $quickInfo: HTMLElement
  fontWidth: number
  fontFamily: string
  fileName: string
  codeUrl: string
  offsetTop: number
  lineHeight: number
  lineWidth: number
  paddingTop: number
  tabSize: number
}

interface AppState {
  occurrences?: Occurrence[]
  definition?: Definition
  quickInfo?: QuickInfo
}

export default class App extends Component<AppProps, AppState> {
  state: AppState = {}

  $container: HTMLElement

  constructor(props: any) {
    super(props)
    this.$container = props.container
  }

  async sendMessage(message: ContentMessage): Promise<BackgroundMessage> {
    return await new Promise(resolve => {
      chrome.runtime.sendMessage(message, response => {
        resolve(response)
      })
    })
  }

  getPosition(e: MouseEvent) {
    const rect = this.props.$background.getBoundingClientRect()
    return {
      // Must be integers, so use Math.floor
      x: Math.floor((e.clientX - rect.left) / this.props.fontWidth),
      y: Math.floor((e.clientY - rect.top) / this.props.lineHeight),
    }
  }

  componentDidMount() {
    // keydown: change mouse cursor to pointer
    document.addEventListener('keydown', e => {
      console.log('keydown', e)
      if (isMeta(e)) {
        // FIXME: Slow when file is large
        this.$container.style.cursor = 'pointer'
        // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
        setTimeout(() => {
          this.$container.style.cursor = ''
        }, 10000)
      }
    })

    // keyup: recover mouse cursor
    document.addEventListener('keyup', e => {
      console.log('keyup', e)
      if (isMeta(e)) {
        this.$container.style.cursor = ''
      }
    })

    // click: show occurrences
    // if meta key is pressed, also show definition and scroll to it
    this.$container.addEventListener('click', async e => {
      console.log('click', e)

      const position = this.getPosition(e)
      if (position.x < 0 || position.y < 0) {
        return
      }

      const response = (await this.sendMessage({
        type: MessageType.occurrence,
        file: this.props.fileName,
        position,
        meta: isMacOS ? e.metaKey : e.ctrlKey,
        codeUrl: this.props.codeUrl,
        tabSize: this.props.tabSize,
      })) as BackgroundMessageOfOccurrence

      // TODO: Fix overflow when length is large
      this.setState({ definition: response.info, occurrences: response.occurrences })

      if (response.info) {
        window.scrollTo(
          0,
          this.props.offsetTop +
            this.props.paddingTop +
            response.info.line * this.props.lineHeight -
            80,
        ) // TODO: Magic number
      }

      // TODO: Exclude click event triggered by selecting text
      // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
      // if (window.getSelection().toString()) {
      //   return
      // }
    })

    // mousemove: show quick info on stop
    this.$container.addEventListener(
      'mousemove',
      debounce(async (e: MouseEvent) => {
        // console.log('mousemove', e)
        const position = this.getPosition(e)

        if (position.x < 0 || position.y < 0) {
          return
        }

        const { data } = (await this.sendMessage({
          file: this.props.fileName,
          codeUrl: this.props.codeUrl,
          type: MessageType.quickInfo,
          position,
          tabSize: this.props.tabSize,
        })) as BackgroundMessageOfQuickInfo
        this.setState({ quickInfo: data })
      }, DEBOUNCE_TIMEOUT),
    )

    // mouseout: hide quick info on leave
    this.$container.addEventListener('mouseout', e => {
      // console.log('mouseout', e)
      this.setState({ quickInfo: undefined })
    })
  }

  render() {
    const { definition, occurrences, quickInfo } = this.state

    return (
      <div>
        {definition && (
          <div
            style={{
              position: 'absolute',
              background: colors.lineBg,
              left: 0,
              width: this.props.lineWidth - 20, // TODO: Magic number
              height: this.props.lineHeight,
              top: definition.line * this.props.lineHeight,
            }}
          />
        )}
        {occurrences &&
          occurrences.map(occurrence => (
            <div
              style={{
                position: 'absolute',
                background: occurrence.isWriteAccess
                  ? colors.occurrenceWrite
                  : colors.occurrenceRead,
                width: occurrence.width * this.props.fontWidth,
                height: this.props.lineHeight,
                top: occurrence.range.line * this.props.lineHeight,
                left: occurrence.range.character * this.props.fontWidth,
              }}
            />
          ))}

        {quickInfo && (
          <div
            style={{
              position: 'absolute',
              background: colors.quickInfoBg,
              // lineHeight: '20px',
              top: quickInfo.range.line * this.props.lineHeight,
              left: quickInfo.range.character * this.props.fontWidth,
              width: quickInfo.width * this.props.fontWidth,
              height: this.props.lineHeight,
            }}
          />
        )}

        <Portal into={this.props.$quickInfo}>
          {quickInfo && quickInfo.info && (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                position: 'absolute',
                backgroundColor: '#efeff2',
                border: `1px solid #c8c8c8`,
                fontSize: 12,
                padding: `2px 4px`,
                fontFamily: this.props.fontFamily,
                left: quickInfo.range.character * this.props.fontWidth,
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
                  if (quickInfo.range.line < 2) {
                    positionStyle.top = (quickInfo.range.line + 1) * this.props.lineHeight
                  } else {
                    positionStyle.bottom = 0 - quickInfo.range.line * this.props.lineHeight
                  }

                  return positionStyle
                })(),
              }}
            >
              {Array.isArray(quickInfo.info)
                ? quickInfo.info.map(part => {
                    if (part.text === '\n') {
                      return <br />
                    }
                    return <span style={{ color: getColorFromKind(part.kind) }}>{part.text}</span>
                  })
                : quickInfo.info.replace(/\\/g, '')
              // JSON.parse(`"${info}"`)
              }
            </div>
          )}
        </Portal>
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

function isMeta(e: KeyboardEvent) {
  return isMacOS ? e.key === 'Meta' : e.key === 'Control'
}

import { h, FunctionComponent } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import Portal from 'preact-portal'
import { Nullable } from 'tsdef'
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
} from './types'
import { JSXInternal } from 'preact/src/jsx'

const colors = {
  lineBg: '#fffbdd',
  quickInfoBg: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}

const DEBOUNCE_TIMEOUT = 300
const isMacOS = /Mac OS X/i.test(navigator.userAgent)

interface AppProps {
  container: HTMLElement
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

export const App: FunctionComponent<AppProps> = (props) => {
  const $container = props.container

  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [definition, setDefinition] = useState<Nullable<Definition>>(null)
  const [quickInfo, setQuickInfo] = useState<Nullable<QuickInfo>>(null)

  const sendMessage = async (message: ContentMessage): Promise<BackgroundMessage> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response)
      })
    })
  }

  const getPosition = (e: MouseEvent) => {
    const rect = props.$background.getBoundingClientRect()
    return {
      // Must be integers, so use Math.floor
      x: Math.floor((e.clientX - rect.left) / props.fontWidth),
      y: Math.floor((e.clientY - rect.top) / props.lineHeight),
    }
  }

  useEffect(() => {
    // keydown: change mouse cursor to pointer
    document.addEventListener('keydown', (e) => {
      console.log('keydown', e)
      if (isMeta(e)) {
        // FIXME: Slow when file is large
        $container.style.cursor = 'pointer'
        // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
        setTimeout(() => {
          $container.style.cursor = ''
        }, 10000)
      }
    })

    // keyup: recover mouse cursor
    document.addEventListener('keyup', (e) => {
      console.log('keyup', e)
      if (isMeta(e)) {
        $container.style.cursor = ''
      }
    })

    // click: show occurrences
    // if meta key is pressed, also show definition and scroll to it
    $container.addEventListener('click', async (e) => {
      console.log('click', e)

      const position = getPosition(e)
      if (position.x < 0 || position.y < 0) {
        return
      }

      const response = (await sendMessage({
        type: MessageType.occurrence,
        file: props.fileName,
        position,
        meta: isMacOS ? e.metaKey : e.ctrlKey,
        codeUrl: props.codeUrl,
        tabSize: props.tabSize,
      })) as BackgroundMessageOfOccurrence

      // TODO: Fix overflow when length is large
      if (response.info) setDefinition(response.info)
      if (response.occurrences) setOccurrences(response.occurrences)

      if (response.info) {
        window.scrollTo(
          0,
          props.offsetTop + props.paddingTop + response.info.line * props.lineHeight - 80,
        ) // TODO: Magic number
      }

      // TODO: Exclude click event triggered by selecting text
      // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
      // if (window.getSelection().toString()) {
      //   return
      // }
    })

    // mousemove: show quick info on stop
    $container.addEventListener(
      'mousemove',
      debounce(async (e: MouseEvent) => {
        // console.log('mousemove', e)
        const position = getPosition(e)

        if (position.x < 0 || position.y < 0) {
          return
        }

        const { data } = (await sendMessage({
          file: props.fileName,
          codeUrl: props.codeUrl,
          type: MessageType.quickInfo,
          position,
          tabSize: props.tabSize,
        })) as BackgroundMessageOfQuickInfo

        setQuickInfo(data)
      }, DEBOUNCE_TIMEOUT),
    )

    // mouseout: hide quick info on leave
    $container.addEventListener('mouseout', (e) => {
      // console.log('mouseout', e)

      setQuickInfo(null)
    })
  }, [])

  return (
    <div>
      {definition && (
        <div
          style={{
            position: 'absolute',
            background: colors.lineBg,
            left: 0,
            width: props.lineWidth - 20, // TODO: Magic number
            height: props.lineHeight,
            top: definition.line * props.lineHeight,
          }}
        />
      )}
      {occurrences &&
        occurrences.map((occurrence) => (
          <div
            style={{
              position: 'absolute',
              background: occurrence.isWriteAccess ? colors.occurrenceWrite : colors.occurrenceRead,
              width: occurrence.width * props.fontWidth,
              height: props.lineHeight,
              top: occurrence.range.line * props.lineHeight,
              left: occurrence.range.character * props.fontWidth,
            }}
          />
        ))}

      {quickInfo && (
        <div
          style={{
            position: 'absolute',
            background: colors.quickInfoBg,
            // lineHeight: '20px',
            top: quickInfo.range.line * props.lineHeight,
            left: quickInfo.range.character * props.fontWidth,
            width: quickInfo.width * props.fontWidth,
            height: props.lineHeight,
          }}
        />
      )}

      <Portal into={props.$quickInfo}>
        {quickInfo && quickInfo.info && (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              position: 'absolute',
              backgroundColor: '#efeff2',
              border: `1px solid #c8c8c8`,
              fontSize: 12,
              padding: `2px 4px`,
              fontFamily: props.fontFamily,
              left: quickInfo.range.character * props.fontWidth,
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
                const positionStyle: JSXInternal.HTMLAttributes['style'] = {}
                if (quickInfo.range.line < 2) {
                  positionStyle.top = (quickInfo.range.line + 1) * props.lineHeight
                } else {
                  positionStyle.bottom = 0 - quickInfo.range.line * props.lineHeight
                }

                return positionStyle
              })(),
            }}
          >
            {
              typeof quickInfo.info === 'string'
                ? quickInfo.info.replace(/\\/g, '')
                : quickInfo.info.map((part) => {
                    if (part.text === '\n') {
                      return <br />
                    }
                    return <span style={{ color: getColorFromKind(part.kind) }}>{part.text}</span>
                  })

              // JSON.parse(`"${info}"`)
            }
          </div>
        )}
      </Portal>
    </div>
  )
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

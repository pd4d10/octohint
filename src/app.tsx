import { h, FunctionComponent } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { debounce } from 'lodash-es'
import { HintResponse, HintRequest } from './types'
import { JSXInternal } from 'preact/src/jsx'

const colors = {
  lineBg: '#fffbdd',
  quickInfoBg: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}

const isMacOS = /Mac OS X/i.test(navigator.userAgent)

interface AppProps {
  container: HTMLElement
  $background: HTMLElement
  $quickInfo: HTMLElement
  fontWidth: number
  fontFamily: string
  fileName: string
  code: string
  offsetTop: number
  lineHeight: number
  lineWidth: number
  paddingTop: number
  tabSize: number
}

const sendMessage = async (req: HintRequest) => {
  console.log('req', req)

  return new Promise<HintResponse>((resolve) => {
    chrome.runtime.sendMessage(req, (response) => {
      console.log('res', response)
      resolve(response)
    })
  })
}

export const App: FunctionComponent<AppProps> = (props) => {
  const $container = props.container

  const [occurrences, setOccurrences] = useState<HintResponse['occurrences']>()
  const [definition, setDefinition] = useState<HintResponse['definition']>()
  const [quickInfo, setQuickInfo] = useState<HintResponse['quickInfo']>()

  const getPosition = (e: MouseEvent) => {
    const rect = props.$background.getBoundingClientRect()

    // must be integers
    const line = Math.floor((e.clientY - rect.top) / props.lineHeight)
    const character = Math.floor((e.clientX - rect.left) / props.fontWidth)

    if (line > 0 && character > 0) {
      return { line, character }
    }
  }

  const inContainer = (e: MouseEvent) => {
    return e.target instanceof HTMLElement && $container.contains(e.target)
  }

  useEffect(() => {
    const handleResponse = (res: HintResponse) => {
      // TODO: Fix overflow when length is large
      if (res.definition) {
        setDefinition(res.definition)
        window.scrollTo(0, props.offsetTop + props.paddingTop + res.definition.line * props.lineHeight - 80) // TODO: Magic number
      }

      if (res.occurrences) {
        setOccurrences(res.occurrences)
      }

      if (res.quickInfo) {
        setQuickInfo(res.quickInfo)
      }
    }

    // click: show occurrences
    // if meta key is pressed, also show definition and scroll to it
    document.addEventListener('click', async (e) => {
      if (!inContainer(e)) return
      console.log('click', e)

      const position = getPosition(e)
      if (!position) return

      const res = await sendMessage({
        type: 'click',
        file: props.fileName,
        meta: isMacOS ? e.metaKey : e.ctrlKey,
        code: props.code,
        tabSize: props.tabSize,
        ...position,
      })
      handleResponse(res)

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
        if (!inContainer(e)) return

        // console.log('mousemove', e)
        const position = getPosition(e)
        if (!position) return

        const res = await sendMessage({
          type: 'hover',
          file: props.fileName,
          code: props.code,
          tabSize: props.tabSize,
          ...position,
        })
        handleResponse(res)
      }, 300)
    )

    // mouseout: hide quick info on leave
    $container.addEventListener('mouseout', (e) => {
      if (!inContainer(e)) return

      // console.log('mouseout', e)
      setQuickInfo(undefined)
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

      {quickInfo?.info &&
        createPortal(
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
          </div>,
          props.$quickInfo
        )}
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

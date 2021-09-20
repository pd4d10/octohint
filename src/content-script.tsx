import { render, h, Fragment } from 'preact'
import { createPortal } from 'preact/compat'
import githubInject from 'github-injection'
import { slice, debounce } from 'lodash-es'
import { HintRequest, HintResponse } from './types'
import { JSXInternal } from 'preact/src/jsx'

const toStyleText = (obj: { [key: string]: string | number }) => {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

const getFontParams = (fontDom: HTMLElement) => {
  const testDom = document.createElement('span')
  testDom.innerText = '0'
  fontDom.appendChild(testDom)

  const style = getComputedStyle(testDom)
  const result = {
    width: testDom.getBoundingClientRect().width,
    family: style.fontFamily || 'monospace',
  }

  testDom.remove()
  return result
}

const getOffsetTop = (e: HTMLElement): number => {
  if (!e) {
    return 0
  }
  const parent = e.offsetParent as HTMLElement
  return e.offsetTop + getOffsetTop(parent)
}

// '20px' => 20
const px2num = (px: string | null) => {
  if (px) {
    return parseInt(px.replace('px', ''), 10)
  } else {
    return 0
  }
}

interface InitProps {
  container: HTMLElement
  $background: HTMLElement
  $quickInfo: HTMLElement
  fontWidth: number
  fontFamily: string
  fileName: string
  code: string
  lineHeight: number
  tabSize: number
}

let initProps: InitProps | undefined

/**
 * Principles:
 * Do not break DOM position as mush as possible
 * Like set `position` property to existing DOM
 *
 * <container>           +--------------------+
 *   - container padding top + border top
 *              +--------------------+
 *   <background />
 *  +-----------------------------
 *  |                padding top
 *  |              +-----------
 *  | padding left | Code area
 *  |              +----------
 *  |                padding bottom
 *  +-------------------------------
 *   <quickInfo />
 *               ---------------
 *   - container padding bottom + border bottom
 * </container>  +--------------------+
 *
 * Problems:
 * 1. Masks should not cover code
 * 2. Masks should not be selected
 * 3. Masks should follow Horizontal scroll
 * 4. Quick info overflow on first or second line
 *
 * DOM structure    - z-index
 *
 * <container>
 *   <background /> - 0
 *   ...            - 1
 *   <quickInfo />  - 2
 * </container>
 *
 * <container> and its childrens should not set background-color
 * Order: background -> other childrens(including code) -> quickInfo
 */
const init = (e: MouseEvent, req: RenderRequest) => {
  if (!(e.target instanceof HTMLElement)) return

  if (initProps && document.contains(initProps.container)) return

  // reset response
  response = {}

  const container = e.target.closest<HTMLElement>(req.selector)
  if (!container) return

  console.log('container:', container)

  const fontDom = $(req.fontSelector)
  if (!fontDom) return

  const tabSize = parseInt(getComputedStyle(fontDom).getPropertyValue('tab-size'), 10) || 8 // TODO: Firefox

  // Get font width and family
  const fontParams = getFontParams(fontDom)

  // TODO: This is pretty tricky for making GitLab and Bitbucket work
  // if (beforeRender) beforeRender()

  const containerRect = container.getBoundingClientRect()
  const wrapperWidth = `${containerRect.width - req.paddingLeft - 10}px`

  const $background = document.createElement('div')
  $background.setAttribute(
    'style',
    toStyleText({
      position: 'relative',
      // zIndex: -1, // Set z-index to -1 makes GitLab occurrence not show
      top: req.paddingTop + 'px',
      left: req.paddingLeft + 'px',
      width: wrapperWidth,
    })
  )

  const $quickInfo = document.createElement('div')
  const style = getComputedStyle(container)
  const paddingAndBorderOfContainer =
    px2num(style.paddingTop) +
    px2num(style.paddingBottom) +
    px2num(style.borderTopWidth) +
    px2num(style.borderBottomWidth)
  $quickInfo.setAttribute(
    'style',
    toStyleText({
      position: 'relative',
      width: wrapperWidth, // Important, make quick info show as wide as possible
      // zIndex: 2,
      bottom: `${containerRect.height - paddingAndBorderOfContainer - req.paddingTop}px`,
      left: `${req.paddingLeft}px`,
    })
  )

  container.insertBefore($background, container.firstChild)
  container.appendChild($quickInfo)

  const lineHeight = fontDom.getBoundingClientRect().height

  initProps = {
    container,
    $background,
    $quickInfo,
    fontWidth: fontParams.width,
    fontFamily: fontParams.family,
    fileName: req.getFileName(),
    code: req.getCode(container),
    lineHeight,
    tabSize,
  }
}

const $ = (selector: string, wrapper: HTMLElement = document.body) => {
  return wrapper.querySelector<HTMLElement>(selector)
}
const $$ = (selector: string, wrapper: HTMLElement = document.body) => {
  return slice(wrapper.querySelectorAll<HTMLElement>(selector))
}

interface RenderRequest {
  selector: string
  fontSelector: string
  paddingLeft: number
  paddingTop: number
  getFileName(): string
  getCode(container: HTMLElement): string
}

const githubRenderRequest: RenderRequest = {
  selector: '.blob-wrapper',
  fontSelector: '#LC1',
  paddingLeft: 60,
  paddingTop: 0,
  getFileName() {
    // replace `//` with `/` to simulate file system path
    return '/' + location.host + location.pathname
  },
  getCode(container) {
    return $$('tr>td:nth-child(2)', container).reduce((code, el) => {
      const line = el.innerText.replaceAll('\n', '') // empty line has an extra '\n', remove it
      return code + line + '\n'
    }, '')
  },
}

// function getGithubGistParams(wrapper: HTMLElement): RenderParams | undefined {
//   const container = $('.blob-wrapper', wrapper)
//   const fontDom = $('.blob-wrapper .blob-code', wrapper)
//   const tabSizeDom = $('.blob-wrapper table', wrapper)
//   const fileInfo = $('.file-info', wrapper)
//   if (!container || !fontDom || !tabSizeDom || !fileInfo) return

//   return {
//     container,
//     fontDom,
//     tabSizeDom,
//     lineWidth: 918,
//     lineHeight: 20,
//     paddingLeft: 60,
//     paddingTop: 0,
//     code: getGithubCode(container),
//     fileName: getFilePath().replace(/\/$/, '') + fileInfo.innerText.trim(),
//   }
// }

// const BitbucketRenderer: RendererParams = {
//   getContainer: () => $('.view-lines'),
//   getFontDOM: () => $('.view-lines span'),
//   getLineWidthAndHeight: () => ({
//     width: (<HTMLElement>$('.view-lines .view-line')).offsetWidth - 43,
//     height: 18,
//   }),
//   paddingLeft: 0,
//   paddingTop: 0,
//   getCodeUrl: () => getCurrentUrl().replace('/src/', '/raw/'),
//   getFileName: getFilePath,
//   // extraBeforeRender: () => (($('.file-source .code pre') as HTMLElement).style.position = 'relative'),
// }

// // This GitLab is for old version
// // TODO: New version use dynamic loading
// const GitLabRenderer: RendererParams = {
//   getContainer: () => $('.blob-content .code'),
//   getFontDOM: () => $('#LC1'),
//   getLineWidthAndHeight: () => $('#LC1')!.getBoundingClientRect(),
//   paddingLeft: 10,
//   paddingTop: 0,
//   getCodeUrl: () => getCurrentUrl().replace('/blob/', '/raw/'),
//   getFileName: getFilePath,
//   beforeRender: () => {
//     const $code = $('.blob-content .code code') as HTMLElement
//     $code.style.position = 'relative'
//     $code.style.background = 'transparent'
//   },
// }

// let prevContainer: Element | null

// // TODO:
// const addMutationObserver = (
//   container: Element | null,
//   params: RendererParams,
//   extraCondition = true,
// ) => {
//   if (!container || !extraCondition) return

//   new MutationObserver(mutations => {
//     mutations.forEach(mutation => {
//       console.log(mutation)
//       if (mutation.type === 'childList' && mutation.addedNodes.length) {
//         // This fix GitHub trigger multi mutations sometimes while dynamic loading
//         // Check if current container equals to previous, if same then ignore
//         const container = params.getContainer()
//         if (container && prevContainer !== container) {
//           renderToContainer(params)
//           prevContainer = container
//         }
//       }
//     })
//   }).observe(container, {
//     attributes: true,
//     childList: true,
//     characterData: true,
//   })
// }

// GitHub Gist
// if (location.host === 'gist.github.com') {
//   $$('.js-gist-file-update-container')?.forEach((container) => {
//     const params = getGithubGistParams(container as HTMLElement)
//     if (params) {
//       renderToContainer(params)
//     }
//   })
// } else {
//   // GitHub
//   // TODO: Dynamic import
//   // May be deployed at private domain, URL
//   // So use DOM selector
//   const params = getGithubParams()
//   if (params) {
//     githubInject(() => {
//       const params = getGithubParams()
//       if (params) renderToContainer(params)
//     })
//   } else {
//   }
// }

const sendMessage = async (req: HintRequest) => {
  console.log('req', req)

  return new Promise<HintResponse>((resolve) => {
    chrome.runtime.sendMessage(req, (response) => {
      console.log('res', response)
      resolve(response)
    })
  })
}

const getPosition = (e: MouseEvent, lineHeight: number, fontWidth: number, $background: HTMLElement) => {
  const rect = $background.getBoundingClientRect()

  // must be integers
  const line = Math.floor((e.clientY - rect.top) / lineHeight)
  const character = Math.floor((e.clientX - rect.left) / fontWidth)

  if (line > 0 && character > 0) {
    return { line, character }
  }
}

const isMacOS = /Mac OS X/i.test(navigator.userAgent)

const colors = {
  quickInfoBg: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
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

let response: HintResponse = {}

const handleResponse = (res: HintResponse, props: InitProps) => {
  response = { ...response, ...res }
  const { definition, occurrences, quickInfo } = response

  if (definition) {
    const line = definition.line + 1
    document.querySelector<HTMLElement>('#L' + line)?.click() // TODO: reset definition
  }

  render(
    <>
      {occurrences?.map((occurrence) => (
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
    </>,
    props.$background
  )
}

// click: show occurrences
// if meta key is pressed, also show definition and scroll to it
document.addEventListener('click', async (e) => {
  init(e, githubRenderRequest)
  if (!initProps) return

  console.log('click', e)

  const position = getPosition(e, initProps.lineHeight, initProps.fontWidth, initProps.$background)
  if (!position) return

  const res = await sendMessage({
    type: 'click',
    file: initProps.fileName,
    meta: isMacOS ? e.metaKey : e.ctrlKey,
    code: initProps.code,
    tabSize: initProps.tabSize,
    ...position,
  })
  handleResponse(res, initProps)

  // TODO: Exclude click event triggered by selecting text
  // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
  // if (window.getSelection().toString()) {
  //   return
  // }
})

// mousemove: show quick info on stop
document.addEventListener(
  'mousemove',
  debounce(async (e: MouseEvent) => {
    init(e, githubRenderRequest)
    if (!initProps) return

    // console.log('mousemove', e)
    const position = getPosition(e, initProps.lineHeight, initProps.fontWidth, initProps.$background)
    if (!position) return

    const res = await sendMessage({
      type: 'hover',
      file: initProps.fileName,
      code: initProps.code,
      tabSize: initProps.tabSize,
      ...position,
    })
    handleResponse(res, initProps)
  }, 300)
)

// mouseout: hide quick info on leave
document.addEventListener('mouseout', (e) => {
  init(e, githubRenderRequest)
  if (!initProps) return

  // console.log('mouseout', e)
  handleResponse({ quickInfo: undefined }, initProps)
})

// GitLab
// FIXME: Use `document.documentElement` may cause problems when DOM added by other extensions
// this.addMutationObserver(document.documentElement, GitLabRenderer, GitLabRenderer.getContainer() !== null)

// Direct loading, like browser go back
// renderToContainer(GitLabRenderer)
// return

// Bitbucket
// Seems Bitbucket already use monaco-editor to show code
// this.addMutationObserver($('.react-monaco-editor-container'), BitbucketRenderer)
// if (BitbucketRenderer.getContainer()) {
//   new Renderer(BitbucketRenderer)
//   return
// }

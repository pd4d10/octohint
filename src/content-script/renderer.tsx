import { render, h } from 'preact'
import { RenderParams } from './adapter'
import App from './app'
import { MessageType } from '../types'

const getFontParams = (fontDom: HTMLElement) => {
  const testDom = document.createElement('span')
  testDom.innerText = '0'
  fontDom.appendChild(testDom)

  const style = getComputedStyle(testDom)
  const result = {
    width: testDom.getBoundingClientRect().width,
    family: style.fontFamily,
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
export const renderToContainer = ({
  container,
  fontDom,
  tabSizeDom,
  lineWidth,
  lineHeight,
  paddingLeft,
  paddingTop,
  codeUrl,
  fileName,
  beforeRender,
}: RenderParams) => {
  console.log('container:', container)

  const tabSize = parseInt(getComputedStyle(tabSizeDom as HTMLElement).tabSize, 10) || 8

  // Get font width and family
  const fontParams = getFontParams(fontDom)

  // TODO: This is pretty tricky for making GitLab and Bitbucket work
  if (beforeRender) beforeRender()

  // container.style.position = 'relative'
  // this.$positionContainer.style.position = 'relative'
  // ;[].forEach.call(container.children, ($child: HTMLElement) => {
  //   $child.style.position = 'relative'
  //   $child.style.zIndex = '1'
  // })

  const { width, height } = container.getBoundingClientRect()
  const wrapperWidth = `${width - paddingLeft - 10}px`

  const $background = document.createElement('div')
  $background.style.position = 'relative'
  // $background.style.zIndex = '-1' // Set z-index to -1 makes GitLab occurrence not show
  $background.style.top = `${paddingTop}px`
  $background.style.left = `${paddingLeft}px`
  $background.style.width = wrapperWidth // Important, fix Y scrollbar

  const $quickInfo = document.createElement('div')
  $quickInfo.style.position = 'relative'
  const style = getComputedStyle(container)
  const paddingAndBorderOfContainer =
    px2num(style.paddingTop) +
    px2num(style.paddingBottom) +
    px2num(style.borderTopWidth) +
    px2num(style.borderBottomWidth)

  $quickInfo.style.width = wrapperWidth // Important, make quick info show as wide as possible
  // $quickInfo.style.zIndex = '2'
  $quickInfo.style.bottom = `${height - paddingAndBorderOfContainer - paddingTop}px`
  $quickInfo.style.left = `${paddingLeft}px`

  container.insertBefore($background, container.firstChild)
  container.appendChild($quickInfo)

  render(
    <App
      {...{
        container,
        $background,
        $quickInfo,
        fontWidth: fontParams.width,
        fontFamily: fontParams.family,
        fileName,
        codeUrl,
        offsetTop: getOffsetTop(container),
        lineWidth,
        lineHeight,
        paddingTop,
      }}
    />,
    $background,
  )

  // Create service on page load
  chrome.runtime.sendMessage({
    type: MessageType.service,
    file: fileName,
    codeUrl: codeUrl,
    tabSize,
  })
}

import { render, h } from 'preact'
import * as types from '../types'
import { RendererParams } from './adapter'
import App from './app'

interface Padding {
  left: number
  top: number
}

interface Line {
  width: number
  height: number
}

export default class Renderer {
  renderParams: RendererParams

  $background!: Element
  fileName: string

  $container: HTMLElement
  // $positionContainer: HTMLElement
  fontWidth!: number
  fontFamily!: string | null
  fontSize!: string | null
  line!: Line
  padding!: Padding
  code!: string
  offsetTop: number
  codeUrl: string

  sendMessage: (data: types.ContentMessage, cb: (message: types.BackgroundMessage) => void) => void

  constructor(
    sendMessage: (data: types.ContentMessage, cb: (message: types.BackgroundMessage) => void) => void,
    renderParams: RendererParams,
  ) {
    this.sendMessage = sendMessage
    this.renderParams = renderParams
    this.fileName = renderParams.getFileName()
    this.$container = renderParams.getContainer() as HTMLElement
    console.log('container:', this.$container)

    const tabSizeDom = renderParams.getTabSizeDom ? renderParams.getTabSizeDom() : this.$container
    const tabSize = parseInt(getComputedStyle(tabSizeDom as HTMLElement).tabSize, 10) || 8

    // this.$positionContainer = renderParams.getPositionContainer
    //   ? renderParams.getPositionContainer() as HTMLElement
    //   : this.$container
    // No need to check if DOM exists, already check it at initialization
    // this.$container = this.$positionContainer

    this.offsetTop = this.getOffsetTop(this.$container)

    this.codeUrl = renderParams.getCodeUrl()

    // Get font width and family
    const fontDOM = renderParams.getFontDOM() as HTMLElement
    if (!fontDOM) return
    this.line = renderParams.getLineWidthAndHeight()

    const testDOM = document.createElement('span')
    testDOM.innerText = '0'
    fontDOM.appendChild(testDOM)
    this.fontWidth = testDOM.getBoundingClientRect().width
    ;({ fontFamily: this.fontFamily, fontSize: this.fontSize } = getComputedStyle(testDOM))
    testDOM.remove()

    this.padding = renderParams.getPadding(this.fontWidth)

    this.render(this.$container)
    // Create service on page load
    this.sendMessage(
      {
        file: this.fileName,
        type: types.Message.service,
        codeUrl: this.codeUrl,
        tabSize,
      },
      () => {},
    )
  }

  getOffsetTop(e: HTMLElement): number {
    if (!e) {
      return 0
    }
    const parent = e.offsetParent as HTMLElement
    return e.offsetTop + this.getOffsetTop(parent)
  }

  // '20px' => 20
  px2num(px: string | null) {
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
  render($container: HTMLElement) {
    // TODO: This is pretty tricky for making GitLab and Bitbucket work
    if (this.renderParams.extraBeforeRender) {
      this.renderParams.extraBeforeRender()
    }

    // this.$container.style.position = 'relative'
    // this.$positionContainer.style.position = 'relative'
    // ;[].forEach.call($container.children, ($child: HTMLElement) => {
    //   $child.style.position = 'relative'
    //   $child.style.zIndex = '1'
    // })

    const { width, height } = $container.getBoundingClientRect()
    const wrapperWidth = `${width - this.padding.left - 10}px`

    const $background = document.createElement('div')
    $background.style.position = 'relative'
    // $background.style.zIndex = '-1' // Set z-index to -1 makes GitLab occurrence not show
    $background.style.top = `${this.padding.top}px`
    $background.style.left = `${this.padding.left}px`
    $background.style.width = wrapperWidth // Important, fix Y scrollbar

    this.$background = $background
    const $quickInfo = document.createElement('div')
    $quickInfo.style.position = 'relative'
    const style = getComputedStyle($container)
    const paddingAndBorderOfContainer =
      this.px2num(style.paddingTop) +
      this.px2num(style.paddingBottom) +
      this.px2num(style.borderTopWidth) +
      this.px2num(style.borderBottomWidth)

    $quickInfo.style.width = wrapperWidth // Important, make quick info show as wide as possible
    // $quickInfo.style.zIndex = '2'
    $quickInfo.style.bottom = `${height - paddingAndBorderOfContainer - this.padding.top}px`
    $quickInfo.style.left = `${this.padding.left}px`

    $container.insertBefore($background, $container.firstChild)
    $container.appendChild($quickInfo)
    this.$quickInfo = $quickInfo

    render(<App {...this} />, $background)
  }
}

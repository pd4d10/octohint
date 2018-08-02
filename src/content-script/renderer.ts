import { debounce } from 'lodash'
import { LineAndCharacter } from 'typescript'
import { renderToDOM } from './containers'
import {
  MessageType,
  MessageFromContentScript,
  MessageFromBackground,
  BackgroundMessageOfOccurrence,
  BackgroundMessageOfQuickInfo,
  Range,
} from '../types'
import { RendererParams } from './adapter'

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

  $background: Element
  fileName: string
  DEBOUNCE_TIMEOUT = 300
  isMacOS = /Mac OS X/i.test(navigator.userAgent)

  $container: HTMLElement
  // $positionContainer: HTMLElement
  fontWidth: number
  fontFamily: string | null
  fontSize: string | null
  line: Line
  padding: Padding
  code: string
  offsetTop: number
  codeUrl: string
  editorConfigUrl?: string
  setState = () => {}

  sendMessage: (data: MessageFromContentScript, cb: (message: MessageFromBackground) => void) => void

  constructor(
    sendMessage: (data: MessageFromContentScript, cb: (message: MessageFromBackground) => void) => void,
    renderParams: RendererParams
  ) {
    this.sendMessage = sendMessage
    this.renderParams = renderParams
    this.fileName = renderParams.getFileName()
    this.$container = renderParams.getContainer() as HTMLElement
    // this.$positionContainer = renderParams.getPositionContainer
    //   ? renderParams.getPositionContainer() as HTMLElement
    //   : this.$container
    // No need to check if DOM exists, already check it at initialization
    // this.$container = this.$positionContainer

    this.offsetTop = this.getOffsetTop(this.$container)
    if (renderParams.getEditorConfigUrl) {
      this.editorConfigUrl = renderParams.getEditorConfigUrl()
    }

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
    this.addEventListener(this.$container)
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)

    // Create service on page load
    this.sendMessage(
      {
        file: this.fileName,
        type: MessageType.service,
        codeUrl: this.codeUrl,
        editorConfigUrl: this.editorConfigUrl,
      },
      () => {}
    )
  }

  addEventListener($container: HTMLElement) {
    $container.addEventListener('click', this.handleClick)
    $container.addEventListener('mousemove', this.handleMouseMove)
    $container.addEventListener('mouseout', this.handleMouseOut)
  }

  getOffsetTop(e: HTMLElement): number {
    if (!e) {
      return 0
    }
    const parent = e.offsetParent as HTMLElement
    return e.offsetTop + this.getOffsetTop(parent)
  }

  getPosition(e: MouseEvent) {
    const rect = this.$background.getBoundingClientRect()
    return {
      // Must be integers, so use Math.floor
      x: Math.floor((e.clientX - rect.left) / this.fontWidth),
      y: Math.floor((e.clientY - rect.top) / this.line.height),
    }
  }

  handleClick = (e: MouseEvent) => {
    console.log('click', e)
    const nextState = {
      occurrences: [],
      definition: {
        isVisible: false,
      },
    }

    const position = this.getPosition(e)
    if (position.x < 0 || position.y < 0) {
      return
    }

    this.sendMessage(
      {
        file: this.fileName,
        type: MessageType.occurrence,
        position,
        meta: this.isMacOS ? e.metaKey : e.ctrlKey,
        codeUrl: this.codeUrl,
        editorConfigUrl: this.editorConfigUrl,
      },
      (response: BackgroundMessageOfOccurrence) => {
        if (response.info) {
          Object.assign(nextState, {
            definition: {
              isVisible: true,
              height: this.line.height,
              width: this.line.width - 10, // TODO: Magic number
              top: response.info.line * this.line.height,
            },
          })
          window.scrollTo(0, this.offsetTop + this.padding.top + response.info.line * this.line.height - 80) // TODO: Magic number
        }

        // TODO: Fix overflow when length is large
        const occurrences = response.occurrences.map(occurrence => ({
          height: this.line.height,
          width: occurrence.width * this.fontWidth,
          top: occurrence.range.line * this.line.height,
          left: occurrence.range.character * this.fontWidth,
          isWriteAccess: occurrence.isWriteAccess,
        }))
        Object.assign(nextState, { occurrences })
        this.setState(nextState)
      }
    )

    // TODO: Exclude click event triggered by selecting text
    // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
    // if (window.getSelection().toString()) {
    //   return
    // }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    console.log('keydown', e)
    if (this.isMacOS ? e.key === 'Meta' : e.key === 'Control') {
      // FIXME: Slow when file is large
      this.$container.style.cursor = 'pointer'
      // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
      setTimeout(() => (this.$container.style.cursor = null), 10000)
    }
  }

  handleKeyUp = (e: KeyboardEvent) => {
    console.log('keyup', e)
    if (this.isMacOS ? e.key === 'Meta' : e.key === 'Control') {
      this.$container.style.cursor = null
    }
  }

  handleMouseOut = (e: MouseEvent) => {
    console.log('mouseout', e)
    this.setState({
      quickInfo: {
        isVisible: false,
      },
    })
  }

  handleMouseMove = debounce((e: MouseEvent) => {
    console.log('mousemove', e)
    const position = this.getPosition(e)

    if (position.x < 0 || position.y < 0) {
      return
    }

    const params = {
      file: this.fileName,
      codeUrl: this.codeUrl,
      editorConfigUrl: this.editorConfigUrl,
      type: MessageType.quickInfo,
      position,
    }

    this.sendMessage(params, (response: BackgroundMessageOfQuickInfo) => {
      const { data } = response
      if (data) {
        const { range } = data
        const top = range.line * this.line.height
        this.setState({
          quickInfo: {
            isVisible: true,
            info: data.info,
            top,
            line: range.line,
            left: range.character * this.fontWidth,
            height: this.line.height,
            fontFamily: this.fontFamily,
            fontWidth: this.fontWidth,
            fontSize: this.fontSize,
            width: data.width * this.fontWidth,
          },
        })
      } else {
        this.setState({
          quickInfo: {
            isVisible: false,
          },
        })
      }
    })
  }, this.DEBOUNCE_TIMEOUT)

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

    const $background = document.createElement('div')
    $background.style.position = 'relative'
    $background.style.zIndex = '-1'
    $background.style.top = `${this.padding.top}px`
    $background.style.left = `${this.padding.left}px`

    this.$background = $background

    const $quickInfo = document.createElement('div')
    $quickInfo.style.position = 'relative'
    const { width, height } = $container.getBoundingClientRect()
    const style = getComputedStyle($container)
    const paddingAndBorderOfContainer =
      this.px2num(style.paddingTop) +
      this.px2num(style.paddingBottom) +
      this.px2num(style.borderTopWidth) +
      this.px2num(style.borderBottomWidth)

    $quickInfo.style.width = `${width - this.padding.left}px` // Important, make quick info show as wide as possible
    // $quickInfo.style.zIndex = '2'
    $quickInfo.style.bottom = `${height - paddingAndBorderOfContainer - this.padding.top}px`
    $quickInfo.style.left = `${this.padding.left}px`

    $container.insertBefore($background, $container.firstChild)
    $container.appendChild($quickInfo)

    this.setState = renderToDOM($background, $quickInfo)
  }
}

import { debounce } from 'lodash'
import { LineAndCharacter } from 'typescript'
import { renderToDOM } from '../containers'
import {
  MessageType,
  MessageFromContentScript,
  MessageFromBackground,
  BackgroundMessageOfOccurrence,
  BackgroundMessageOfQuickInfo,
  Range,
} from '../../types'
import { RendererParams } from '../adapters/base'

interface Padding {
  left: number
  top: number
}

interface Line {
  width: number
  height: number
}

export default class Renderer {
  fileName: string
  DEBOUNCE_TIMEOUT = 300
  isMacOS = /Mac OS X/i.test(navigator.userAgent)

  $container: HTMLElement
  fontWidth: number
  fontFamily: string | null
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
    this.fileName = renderParams.getFileName()
    this.$container = renderParams.getContainer() as HTMLElement
    // No need to check if DOM exists, already check it at initialization

    this.line = renderParams.getLineWidthAndHeight()
    this.padding = renderParams.getPadding()
    this.offsetTop = this.getOffsetTop(this.$container)
    if (renderParams.getEditorConfigUrl) {
      this.editorConfigUrl = renderParams.getEditorConfigUrl()
    }

    // Get font width and family
    // TODO: Sometimes there is no fontDOM, better to create it to measure font width
    const fontDOM = renderParams.getFontDOM() as HTMLElement
    if (!fontDOM) return

    this.codeUrl = renderParams.getCodeUrl()

    // https://github.com/Automattic/cli-table/pull/67/files
    // .replace(/[\u3007\u3400-\u4DB5\u4E00-\u9FCB\uE815-\uE864]|[\uD840-\uD87F][\uDC00-\uDFFF]/g, 'xx')
    // TODO: Seems not work because GitLab doesn't show CJK characters precisely 2 times of latin
    this.fontWidth = fontDOM.getBoundingClientRect().width / fontDOM.innerText.length

    this.fontFamily = getComputedStyle(fontDOM).fontFamily
    this.render(this.$container)
    this.addEventListener(this.$container)
    document.addEventListener('keydown', e => this.handleKeyDown(e))
    document.addEventListener('keyup', e => this.handleKeyUp(e))

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
    $container.addEventListener('click', (e: MouseEvent) => this.handleClick(e))
    $container.addEventListener(
      'mousemove',
      debounce((e: MouseEvent) => this.handleMouseMove(e), this.DEBOUNCE_TIMEOUT)
    )
    $container.addEventListener('mouseout', () => this.handleMouseOut())
  }

  getOffsetTop(e: HTMLElement): number {
    if (!e) {
      return 0
    }
    const parent = e.offsetParent as HTMLElement
    return e.offsetTop + this.getOffsetTop(parent)
  }

  getPosition(e: MouseEvent) {
    const rect = this.$container.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - this.padding.left) / this.fontWidth),
      y: Math.floor((e.clientY - rect.top - this.padding.top) / this.line.height),
    }
  }

  handleClick(e: MouseEvent) {
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

  handleKeyDown(e: KeyboardEvent) {
    if (this.isMacOS ? e.key === 'Meta' : e.key === 'Control') {
      // FIXME: Slow when file is large
      this.$container.style.cursor = 'pointer'
      // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
      setTimeout(() => (this.$container.style.cursor = null), 10000)
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    if (this.isMacOS ? e.key === 'Meta' : e.key === 'Control') {
      this.$container.style.cursor = null
    }
  }

  handleMouseOut() {
    this.setState({
      quickInfo: {
        isVisible: false,
      },
    })
  }

  handleMouseMove(e: MouseEvent) {
    const position = this.getPosition(e)

    if (position.x < 0 || position.y < 0) {
      return
    }

    const params = {
      file: this.fileName,
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
  }

  /**
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
    $container.style.position = 'relative'
    ;[].forEach.call($container.children, ($child: HTMLElement) => {
      $child.style.position = 'relative'
      $child.style.zIndex = '1'
    })

    const $background = document.createElement('div')
    $background.style.position = 'absolute'
    $background.style.zIndex = '0'
    $background.style.top = `${this.padding.top}px`
    $background.style.left = `${this.padding.left}px`

    const $quickInfo = document.createElement('div')
    $quickInfo.style.position = 'absolute'
    const containerWidth = $container.getBoundingClientRect().width
    $quickInfo.style.width = `${containerWidth - this.padding.left}px` // Important, make quick info show as wide as possible
    $quickInfo.style.zIndex = '2'
    $quickInfo.style.top = `${this.padding.top}px`
    $quickInfo.style.left = `${this.padding.left}px`

    $container.insertBefore($background, $container.firstChild)
    $container.appendChild($quickInfo)

    this.setState = renderToDOM($background, $quickInfo)
  }
}

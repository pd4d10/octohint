import { debounce } from 'lodash'
import { LineAndCharacter } from 'typescript'
import { renderToDOM, setState } from '../containers'
import {
  MessageType,
  MessageFromContentScript,
  MessageFromBackground,
  BackgroundMessageOfOccurrence,
  BackgroundMessageOfQuickInfo,
  Range,
} from '../../types'
import { RendererParams } from '../adapters/base'

const BACKGROUND_ID = 'octohint-background'

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

  nativeSendMessage: (data: MessageFromContentScript, cb: (message: MessageFromBackground) => void) => void

  constructor(
    nativeSendMessage: (data: MessageFromContentScript, cb: (message: MessageFromBackground) => void) => void,
    renderParams: RendererParams
  ) {
    this.fileName = renderParams.getFileName()
    this.nativeSendMessage = nativeSendMessage

    // If an instance is already set then quit
    // TODO: Support multi instance in one page
    if (document.getElementById(BACKGROUND_ID)) return

    this.$container = renderParams.getContainer() as HTMLElement
    // No need to check if DOM exists, already check it at initialization

    this.line = renderParams.getLineWidthAndHeight()
    this.padding = renderParams.getPadding()
    this.offsetTop = this.getOffsetTop(this.$container)

    // Get font width and family
    // TODO: Sometimes there is no fontDOM, better to create it to measure font width
    const fontDOM = renderParams.getFontDOM() as HTMLElement
    if (!fontDOM) return

    this.codeUrl = renderParams.getCodeUrl()

    this.fontWidth = fontDOM.getBoundingClientRect().width / fontDOM.innerText.length
    this.fontFamily = getComputedStyle(fontDOM).fontFamily
    this.render()

    // Create service on page load
    this.nativeSendMessage(
      {
        file: this.fileName,
        type: MessageType.service,
        codeUrl: this.codeUrl,
      },
      () => {}
    )

    // Add event listener
    this.$container.addEventListener('click', (e: MouseEvent) => this.handleClick(e))
    this.$container.addEventListener(
      'mousemove',
      debounce((e: MouseEvent) => this.handleMouseMove(e), this.DEBOUNCE_TIMEOUT)
    )
    this.$container.addEventListener('mouseout', () => this.handleMouseOut())
    document.addEventListener('keydown', e => this.handleKeyDown(e))
    document.addEventListener('keyup', e => this.handleKeyUp(e))
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
        setState(nextState)
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
    setState({
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
        setState({
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
        setState({
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
  render() {
    this.$container.style.position = 'relative'
    ;[].forEach.call(this.$container.children, ($child: HTMLElement) => {
      $child.style.position = 'relative'
      $child.style.zIndex = '1'
    })

    const $background = document.createElement('div')
    $background.id = BACKGROUND_ID // This is a signature for initialized
    $background.style.position = 'absolute'
    $background.style.zIndex = '0'
    $background.style.top = `${this.padding.top}px`
    $background.style.left = `${this.padding.left}px`

    const $quickInfo = document.createElement('div')
    $quickInfo.style.position = 'absolute'
    const containerWidth = this.$container.getBoundingClientRect().width
    $quickInfo.style.width = `${containerWidth - this.padding.left}px` // Important, make quick info show as wide as possible
    $quickInfo.style.zIndex = '2'
    $quickInfo.style.top = `${this.padding.top}px`
    $quickInfo.style.left = `${this.padding.left}px`

    this.$container.insertBefore($background, this.$container.firstChild)
    this.$container.appendChild($quickInfo)

    renderToDOM($background, $quickInfo)
  }

  sendMessage(data: MessageFromContentScript, cb: any) {
    this.nativeSendMessage(data, response => {
      console.log(data, response)
      // if (response && response.error === 'no-code') {
      //   this.createService(() => {
      //     this.sendMessage(data, cb)
      //   })
      //   return
      // }
      cb(response)
    })
  }
}

import * as debounce from 'lodash/debounce'
import { renderToDOM, setState } from './containers'

const BACKGROUND_ID = 'intelli-octo-background'

interface Padding {
  left: number,
  top: number,
}

interface Line {
  width: number,
  height: number,
}

interface Occurrence {
  isWriteAccess: boolean,
  width: number,
  range: {
    line: number,
    character: number,
  }
}

const isChrome = window.chrome && window.chrome.runtime

function sendMessage(data, cb) {
  if (isChrome) {
    chrome.runtime.sendMessage(data, cb)
    return
  }

  window.INTELLI_OCTO_ON_MESSAGE = cb
  safari.self.tab.dispatchMessage('from page', data)
}

// For Safari
if (!isChrome) {
  window.INTELLI_OCTO_ON_MESSAGE = () => {}
  safari.self.addEventListener('message', res => {
    window.INTELLI_OCTO_ON_MESSAGE(res.message)
  }, false)
}

abstract class Renderer {
  fileName = location.host + location.pathname // Exclude query and hash
  isActive = /\.(tsx?|jsx?|css|less|scss|html)$/.test(this.fileName)
  tabSize: number

  // Fix URL like https://github.com/mozilla/pdf.js
  // TODO: Add a switch to turn it off
  // TODO: Multi language support

  DEBOUNCE_TIMEOUT = 300
  isMacOS = /Mac OS X/i.test(navigator.userAgent)

  $code: HTMLElement
  fontWidth: number
  fontFamily: string
  line: Line
  padding: Padding
  code: string
  offsetTop: number

  abstract getCodeDOM(): Element | null
  abstract getCode(): string
  abstract getFontDOM(): Element
  abstract getLineWidthAndHeight(): Line
  abstract getPadding(): Padding
  abstract getTabSize(): number

  constructor() {
    if (!this.isActive || document.getElementById(BACKGROUND_ID)) {
      return
    }

    this.$code = <HTMLElement>this.getCodeDOM()

    // If code blob DOM no exists, just quit
    if (!this.$code) {
      return
    }

    this.line = this.getLineWidthAndHeight()
    this.padding = this.getPadding()
    this.code = this.getCode()
    this.offsetTop = this.getOffsetTop(this.$code)

    // Get font width and family
    const fontDOM = <HTMLElement>this.getFontDOM()
    this.fontWidth = fontDOM.getBoundingClientRect().width / fontDOM.innerText.length,
    this.fontFamily = getComputedStyle(fontDOM).fontFamily
    this.tabSize = this.getTabSize()

    this.render()

    this.createService(() => {
      this.$code.addEventListener('click', (e: MouseEvent) => this.handleClick(e))
      this.$code.addEventListener('mousemove', debounce((e: MouseEvent) => this.handleMouseMove(e), this.DEBOUNCE_TIMEOUT))
      this.$code.addEventListener('mouseout', () => this.handleMouseOut())
      document.addEventListener('keydown', e => this.handleKeyDown(e))
      document.addEventListener('keyup', e => this.handleKeyUp(e))
    })
  }

  getOffsetTop(e: HTMLElement): number {
    if (!e) {
      return 0
    }

    const parent = <HTMLElement>e.offsetParent
    return e.offsetTop + this.getOffsetTop(parent)
  }

  getPosition(e: MouseEvent) {
    const rect = this.$code.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - this.padding.left) / this.fontWidth),
      y: Math.floor((e.clientY - rect.top - this.padding.top) / this.line.height)
    }
  }

  getDefinitionStyle(info: object) {
    return {
      height: this.line.height,
      width: this.line.width - 10,
      top: info.line * this.line.height
    }
  }

  getOccurrenceStyle(occurrence: Occurrence) {
    return {
      height: this.line.height,
      width: occurrence.width * this.fontWidth,
      top: occurrence.range.line * this.line.height,
      left: occurrence.range.character * this.fontWidth,
      isWriteAccess: occurrence.isWriteAccess,
    }
  }

  getQuickInfoStyle(range: object) {
    const top = range.line * this.line.height
    return {
      // First line, show quick info below
      infoTop: range.line === 0 ? top + this.line.height : top - 22,
      top,
      left: range.character * this.fontWidth,
      height: this.line.height,
      fontFamily: this.fontFamily
    }
  }

  handleClick(e: MouseEvent) {
    const nextState = {
      occurrences: [],
      definition: {
        isVisible: false,
      }
    }

    const position = this.getPosition(e)

    if (position.x < 0 || position.y < 0) {
      return
    }

    this.sendMessage({
      file: this.fileName,
      type: 'occurrence',
      position,
      meta: this.isMacOS ? e.metaKey : e.ctrlKey,
    }, (response: any) => {
      if (response.info) {
        Object.assign(nextState, {
          definition: {
            isVisible: true,
            ...this.getDefinitionStyle(response.info)
          }
        })
        window.scrollTo(0, this.offsetTop + this.padding.top + response.info.line * this.line.height - 80)
      }

      // TODO: Fix overflow when length is large
      const occurrences = response.occurrences.map((occurrence: any) => this.getOccurrenceStyle(occurrence))
      Object.assign(nextState, { occurrences })
      setState(nextState)
    })

    // TODO: Exclude click event triggered by selecting text
    // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
    // if (window.getSelection().toString()) {
    //   return
    // }
  }

  handleKeyDown(e: KeyboardEvent) {
    if (this.isMacOS ? (e.key === 'Meta') : (e.key === 'Control')) {
      // FIXME: Slow when file is large
      this.$code.style.cursor = 'pointer'
      // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
      setTimeout(() => {
        this.$code.style.cursor = null
      }, 10000)
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    if (this.isMacOS ? (e.key === 'Meta') : (e.key === 'Control')) {
      this.$code.style.cursor = null
    }
  }

  handleMouseOut() {
    setState({
      quickInfo: {
        isVisible: false,
      }
    })
  }

  handleMouseMove(e: MouseEvent) {
    const position = this.getPosition(e)

    if (position.x < 0 || position.y < 0) {
      return
    }

    this.sendMessage({
      file: this.fileName,
      type: 'quickInfo',
      position,
    }, (response: any) => {
      const { data } = response
      if (data) {
        setState({
          quickInfo: {
            isVisible: true,
            info: data.info,
            ...this.getQuickInfoStyle(data.range),
            width: data.width * this.fontWidth,
          }
        })
      } else {
        setState({
          quickInfo: {
            isVisible: false
          }
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
   * DOM structure - z-index
   *
   *   <code>
   *     ... - 1
   *     <background /> - 0
   *     <quickInfo /> - 2
   *   </code>
   *
   * <code> and its childrens should not set background-color
   * Order: background -> code childrens -> quickInfo
   */
  render() {
    this.$code.style.position = 'relative'

    ; [].forEach.call(this.$code.children, ($child: Element) => {
      const $ = <HTMLElement>$child
      $.style.position = 'relative'
      $.style.zIndex = '1'
    })

    const $background = document.createElement('div')
    $background.id = BACKGROUND_ID // This is a signature for initialized
    $background.style.position = 'absolute'
    $background.style.zIndex = '0'
    $background.style.top = `${this.padding.top}px`
    $background.style.left = `${this.padding.left}px`

    const $quickInfo = document.createElement('div')
    $quickInfo.style.position = 'absolute'
    $quickInfo.style.zIndex = '2'
    $quickInfo.style.top = `${this.padding.top}px`
    $quickInfo.style.left = `${this.padding.left}px`

    this.$code.insertBefore($background, this.$code.firstChild)
    this.$code.appendChild($quickInfo)

    renderToDOM($background, $quickInfo)
  }

  sendMessage(data: object, cb: any) {
    sendMessage(data, response => {
      if (response && response.error === 'no-code') {
        this.createService(() => {
          this.sendMessage(data, cb)
        })
        return
      }

      cb(response)
    })
  }

  createService(cb: any) {
    sendMessage({
      file: this.fileName,
      type: 'service',
      code: this.code.replace(/\t/g, ' '.repeat(this.tabSize)), // Replace tab with space
    }, cb)
  }
}

export default Renderer

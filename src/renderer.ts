import { debounce, forEach, map } from 'lodash'
import { render, setState } from './containers'

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

abstract class Renderer {
  fileName = location.href.split('#')[0] // Remove hash
  isActive = /\.(tsx?|jsx?)$/.test(this.fileName) // TODO: Add a switch to turn it off
  DEBOUNCE_TIMEOUT = 300
  isMacOS = /Mac OS X/i.test(navigator.userAgent)

  $code: HTMLElement
  fontWidth: number
  line: Line
  padding: Padding
  code: string
  offsetTop: number

  constructor() {
    if (!this.isActive) {
      return
    }

    this.$code = <HTMLElement>this.getCodeDOM()
    this.fontWidth = this.getFontWidth()
    this.line = this.getLineWidthAndHeight()
    this.padding = this.getPadding()
    this.code = this.getCode()
    this.offsetTop = this.getOffsetTop(this.$code)

    this.render()

    this.createService(() => {
      this.$code.addEventListener('click', (e: MouseEvent) => this.handleClick(e))
      this.$code.addEventListener('mousemove', debounce((e: MouseEvent) => this.handleMouseMove(e), this.DEBOUNCE_TIMEOUT))
      this.$code.addEventListener('mouseout', () => this.handleMouseOut())
      document.addEventListener('keydown', e => this.handleKeyDown(e))
      document.addEventListener('keyup', e => this.handleKeyUp(e))
    })
  }

  abstract getCodeDOM(): Element
  abstract getFontWidth(): number
  abstract getLineWidthAndHeight(): Line
  abstract getPadding(): Padding

  getCode() {
    return this.$code.innerText
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
    return {
      top: range.line * this.line.height,
      left: range.character * this.fontWidth
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

    this.sendMessage({
      file: this.fileName,
      type: 'occurrence',
      position,
      meta: this.isMacOS ? e.metaKey : e.ctrlKey,
    }, response => {
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
      const occurrences = map(response.occurrences, occurrence => this.getOccurrenceStyle(occurrence))
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
    this.sendMessage({
      file: this.fileName,
      type: 'quickInfo',
      position,
    }, response => {
      const { data } = response
      if (data) {
        setState({
          quickInfo: {
            isVisible: true,
            info: data.info,
            ...this.getQuickInfoStyle(data.range)
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

    forEach(this.$code.children, $child => {
      const $ = <HTMLElement>$child
      $.style.position = 'relative'
      $.style.zIndex = '1'
    })

    const $background = document.createElement('div')
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

    render($background, $quickInfo)
  }

  sendMessage(data: object, cb) {
    chrome.runtime.sendMessage(data, response => {
      if (response && response.error === 'no-code') {
        this.createService(() => {
          this.sendMessage(data, cb)
        })
        return
      }

      cb(response)
    })
  }

  createService(cb) {
    chrome.runtime.sendMessage({
      file: this.fileName,
      type: 'service',
      code: this.code,
    }, cb)
  }
}

export default Renderer

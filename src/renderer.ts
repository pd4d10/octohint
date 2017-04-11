import { debounce, forEach } from 'lodash'
import { render, setState } from './containers'

export interface Padding {
  left: number,
  top: number
}

abstract class Renderer {
  isOpen = true
  fileName = location.href + '.ts' // FIXME: Add ts extension
  USAGE_COLOR = 'rgba(173,214,255,.3)'
  WRITE_ACCESS_COLOR = 'rgba(14,99,156,.25)'
  DEBOUNCE_TIMEOUT = 300

  FONT_WIDTH = this.getFontWidth()
  LINE = this.getLineWidthAndHeight()
  PADDING = this.getPadding()
  $code = <HTMLElement>this.getCodeDOM()
  code = this.getCode()

  // abstract renderSwitch(): any
  abstract getCodeDOM(): Element
  abstract getFontWidth(): number
  abstract getPadding(): Padding

  getCode() {
    return this.$code.innerText
  }

  getPosition(e: MouseEvent) {
    const rect = this.$code.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - this.PADDING.left) / this.FONT_WIDTH),
      y: Math.floor((e.clientY - rect.top - this.PADDING.top) / this.LINE.height)
    }
  }

  getDefinitionStyle(info: object) {
    return {
      height: this.LINE.height,
      width: this.LINE.width - 10,
      top: info.line * this.LINE.height
    }
  }

  getOccurrenceStyle(data: object) {
    return {
      height: this.LINE.height,
      width: data.width * this.FONT_WIDTH,
      top: data.range.line * this.LINE.height,
      left: data.range.character * this.FONT_WIDTH,
      isWriteAccess: data.isWriteAccess,
    }
  }

  getQuickInfoStyle(range: object) {
    return {
      top: range.line * this.LINE.height,
      left: range.character * this.FONT_WIDTH
    }
  }

  getLineWidthAndHeight() {
    const rect = document.querySelector('#LC1').getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }

  handleClick(e: MouseEvent) {
    if (!this.isOpen) return
    const nextState = {
      occurrences: [],
      definition: {
        isVisible: false,
      }
    }

    const position = this.getPosition(e)

    chrome.runtime.sendMessage({
      file: this.fileName,
      type: 'occurrence',
      position,
      meta: e.metaKey,
    }, response => {
      if (response.info) {
        Object.assign(nextState, {
          definition: {
            isVisible: true,
            ...this.getDefinitionStyle(response.info)
          }
        })
        // window.scrollTo(0, OFFSET_TOP + response.info.line * LINE_HEIGHT - 50)
      }

      // TODO: Fix overflow when length is large
      // TODO: Fix position when horizontal scroll
      const occurrences = response.occurrences.map(data => this.getOccurrenceStyle(data))
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
    if (!this.isOpen) return

    if (e.key === 'Meta') {
      this.$code.style.cursor = 'pointer'
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    if (!this.isOpen) return

    if (e.key === 'Meta') {
      this.$code.style.cursor = 'default'
    }
  }

  handleMouseOut() {
    if (!this.isOpen) return

    setState({
      quickInfo: {
        isVisible: false,
      }
    })
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.isOpen) return

    const position = this.getPosition(e)
    chrome.runtime.sendMessage({
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
      $child.style.position = 'relative'
      $child.style.zIndex = '1'
    })

    const $background = document.createElement('div')
    $background.style.position = 'absolute'
    $background.style.zIndex = '0'
    $background.style.top = `${this.PADDING.top}px`
    $background.style.left = `${this.PADDING.left}px`

    const $quickInfo = document.createElement('div')
    $quickInfo.style.position = 'absolute'
    $quickInfo.style.zIndex = '2'
    $quickInfo.style.top = `${this.PADDING.top}px`
    $quickInfo.style.left = `${this.PADDING.left}px`

    this.$code.insertBefore($background, this.$code.firstChild)
    this.$code.appendChild($quickInfo)

    render($background, $quickInfo)
  }

  constructor() {
    this.render()

    chrome.runtime.sendMessage({
      file: this.fileName,
      type: 'service',
      data: this.code,
    }, response => {
      console.log(response)
      this.$code.addEventListener('click', (e: MouseEvent) => this.handleClick(e))
      this.$code.addEventListener('mousemove', debounce((e: MouseEvent) => this.handleMouseMove(e), this.DEBOUNCE_TIMEOUT))
      this.$code.addEventListener('mouseout', () => this.handleMouseOut())
      document.addEventListener('keydown', e => this.handleKeyDown(e))
      document.addEventListener('keyup', e => this.handleKeyUp(e))
    })
  }
}

export default Renderer

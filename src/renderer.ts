import renderSwitch from './components/switch.tsx'
import renderHeader from './components/header.tsx'
import renderFooter from './components/footer.tsx'
import { debounce } from 'lodash'

export interface Padding {
  left: number,
  top: number
}

abstract class Renderer {
  isOpen = true
  fileName = location.href
  USAGE_COLOR = 'rgba(173,214,255,.3)'
  WRITE_ACCESS_COLOR = 'rgba(14,99,156,.25)'
  DEBOUNCE_TIMEOUT = 300

  FONT_WIDTH = this.getFontWidth()
  LINE = this.getLineWidthAndHeight()
  PADDING = this.getPadding()
  $code = this.getCodeDOM()

  header: any
  footer: any

  abstract renderSwitch(): any
  abstract getCodeDOM(): HTMLElement
  abstract getFontWidth(): number
  abstract getPadding(): Padding

  getPosition(e: MouseEvent) {
    const rect = this.$code.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - this.PADDING.left) / this.FONT_WIDTH),
      y: Math.floor((e.clientY - rect.top) / this.LINE.height)
    }
  }

  getDefinitionStyle(info: object) {
    return {
      height: `${this.LINE.height}px`,
      width: `${this.LINE.width - 10}px`,
      top: `${info.line * this.LINE.height + this.PADDING.top}px`,
      left: `${this.PADDING.left}px`
    }
  }

  getOccurrenceStyle(data: object) {
    return {
      height: `${this.LINE.height}px`,
      width: `${data.width * this.FONT_WIDTH}px`,
      top: `${data.range.line * this.LINE.height + this.PADDING.top}px`,
      left: `${data.range.character * this.FONT_WIDTH + this.PADDING.left}px`,
      backgroundColor: data.isWriteAccess ? this.WRITE_ACCESS_COLOR : this.USAGE_COLOR,
    }
  }

  getQuickInfoStyle(range: object) {
    return {
      top: `${range.line * this.LINE.height + this.PADDING.top - 22}px`,
      left: `${range.character * this.FONT_WIDTH + this.PADDING.left}px`,
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
      isDefinitionVisible: false
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
          isDefinitionVisible: true,
          definitionStyle: this.getDefinitionStyle(response.info)
        })
        // window.scrollTo(0, OFFSET_TOP + response.info.line * LINE_HEIGHT - 50)
      }

      // TODO: Fix overflow when length is large
      // TODO: Fix position when horizontal scroll
      const occurrences = response.occurrences.map(data => this.getOccurrenceStyle(data))
      Object.assign(nextState, { occurrences })
      this.header.setState(nextState)
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

    this.footer.setState({
      isVisible: false,
    })
    this.header.setState({
      isQuickInfoVisible: false,
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
        this.footer.setState({
          isVisible: true,
          info: data.info,
          style: this.getQuickInfoStyle(data.range)
        })
      } else {
        this.footer.setState({
          isVisible: false
        })
        this.header.setState({
          isVisible: false
        })
      }
    })
  }

  /**
   * DOM structure:
   *
   * <container>
   *   ...
   *   <header /> --- For occurrences and definition highlight
   *   <code />
   *   ...
   *   <footer /> --- For quick info
   * </container>
   */
  render() {
    const $container = this.$code.parentElement
    $container.style.position = 'relative'

    const $header = document.createElement('div')
    $container.insertBefore($header, this.$code)

    const $footer = document.createElement('div')
    $container.appendChild($footer)

    // React instance
    this.header = renderHeader($header)
    this.footer = renderFooter($footer)
    this.renderSwitch()
  }

  constructor() {
    this.render()

    chrome.runtime.sendMessage({
      file: this.fileName,
      type: 'service',
      data: this.$code.innerText,
    }, response => {
      console.log(response)
      this.$code.addEventListener('click', (e: MouseEvent) => this.handleClick(e))
      this.$code.addEventListener('mousemove', debounce(e => this.handleMouseMove(e), this.DEBOUNCE_TIMEOUT))
      this.$code.addEventListener('mouseout', e => this.handleMouseOut(e))
      document.addEventListener('keydown', e => this.handleKeyDown(e))
      document.addEventListener('keyup', e => this.handleKeyUp(e))
    })
  }
}

export default Renderer

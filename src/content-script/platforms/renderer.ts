import * as debounce from 'lodash/debounce'
import { renderToDOM, setState } from '../containers'

const BACKGROUND_ID = 'octohint-background'

interface Padding {
  left: number
  top: number
}

interface Line {
  width: number
  height: number
}

interface Occurrence {
  isWriteAccess: boolean
  width: number
  range: {
    line: number
    character: number
  }
}

const isChrome = window.chrome && window.chrome.runtime

function sendMessage(data, cb) {
  if (isChrome) {
    chrome.runtime.sendMessage(data, cb)
    return
  }

  window.OCTOHINT_ON_MESSAGE = cb
  safari.self.tab.dispatchMessage('from page', data)
}

// For Safari
if (!isChrome) {
  window.OCTOHINT_ON_MESSAGE = () => {}
  safari.self.addEventListener(
    'message',
    res => {
      window.OCTOHINT_ON_MESSAGE(res.message)
    },
    false
  )
}

abstract class Renderer {
  fileName = location.protocol + '//' + location.host + location.pathname // Exclude query and hash
  DEBOUNCE_TIMEOUT = 300
  isMacOS = /Mac OS X/i.test(navigator.userAgent)

  $container: HTMLElement
  fontWidth: number
  fontFamily: string | null
  line: Line
  padding: Padding
  code: string
  offsetTop: number

  abstract getContainer(): Element | null
  abstract getCode(): string
  abstract getFontDOM(): Element | null
  abstract getLineWidthAndHeight(): Line
  abstract getPadding(): Padding
  abstract getTabSize(): number

  constructor() {
    // If an instance is already set then quit
    if (document.getElementById(BACKGROUND_ID)) return

    this.$container = <HTMLElement>this.getContainer()

    // If code blob DOM not exists then quit
    if (!this.$container) return

    this.line = this.getLineWidthAndHeight()
    this.padding = this.getPadding()
    this.code = this.getCode()
    this.offsetTop = this.getOffsetTop(this.$container)

    // Get font width and family
    // FIXME: https://github.com/pd4d10/tiza/blob/v1.0.0/dist/tiza.min.js
    // FIXME: Empty file
    const fontDOM = this.getFontDOM()

    if (!fontDOM) return

    this.fontWidth =
      fontDOM.getBoundingClientRect().width /
      (fontDOM as HTMLElement).innerText.length

    this.fontFamily = getComputedStyle(fontDOM).fontFamily

    this.render()

    this.createService(() => {
      this.$container.addEventListener('click', (e: MouseEvent) =>
        this.handleClick(e)
      )
      this.$container.addEventListener(
        'mousemove',
        debounce(
          (e: MouseEvent) => this.handleMouseMove(e),
          this.DEBOUNCE_TIMEOUT
        )
      )
      this.$container.addEventListener('mouseout', () => this.handleMouseOut())
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
    const rect = this.$container.getBoundingClientRect()
    const data = {
      x: Math.floor(
        (e.clientX - rect.left - this.padding.left) / this.fontWidth
      ),
      y: Math.floor(
        (e.clientY - rect.top - this.padding.top) / this.line.height
      ),
    }
    return data
  }

  getDefinitionStyle(info: object) {
    return {
      height: this.line.height,
      width: this.line.width - 10,
      top: info.line * this.line.height,
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
      top,
      line: range.line,
      left: range.character * this.fontWidth,
      height: this.line.height,
      fontFamily: this.fontFamily,
      fontWidth: this.fontWidth,
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
        type: 'occurrence',
        position,
        meta: this.isMacOS ? e.metaKey : e.ctrlKey,
      },
      (response: any) => {
        if (response.info) {
          Object.assign(nextState, {
            definition: {
              isVisible: true,
              ...this.getDefinitionStyle(response.info),
            },
          })
          window.scrollTo(
            0,
            this.offsetTop +
              this.padding.top +
              response.info.line * this.line.height -
              80
          )
        }

        // TODO: Fix overflow when length is large
        const occurrences = response.occurrences.map((occurrence: any) =>
          this.getOccurrenceStyle(occurrence)
        )
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
      setTimeout(() => {
        this.$container.style.cursor = null
      }, 10000)
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

    this.sendMessage(
      {
        file: this.fileName,
        type: 'quickInfo',
        position,
      },
      (response: any) => {
        const { data } = response
        if (data) {
          setState({
            quickInfo: {
              isVisible: true,
              info: data.info,
              ...this.getQuickInfoStyle(data.range),
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
      }
    )
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
    $quickInfo.style.zIndex = '2'
    $quickInfo.style.top = `${this.padding.top}px`
    $quickInfo.style.left = `${this.padding.left}px`

    this.$container.insertBefore($background, this.$container.firstChild)
    this.$container.appendChild($quickInfo)

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
    const tabSize = this.getTabSize()

    sendMessage(
      {
        file: this.fileName,
        type: 'service',
        code: this.code.replace(/\t/g, ' '.repeat(tabSize)), // Replace tab with space
      },
      cb
    )
  }
}

export default Renderer

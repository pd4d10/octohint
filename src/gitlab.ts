import Renderer from './renderer'

import renderSwitch from './components/switch.tsx'
import renderHeader from './components/header.tsx'
import renderFooter from './components/footer.tsx'

class GitLabRenderer extends Renderer {
  // $content = <HTMLElement>document.querySelector('.file')
  // $header = this.$content.querySelector('.file-header')
  // $actions = this.$header.querySelector('.file-actions')
  // $table = this.$content.querySelector('table')
  // $test = this.$table.querySelector('span')
  // $firstLineGutter = this.$table.querySelector('#L1')
  // $firstLine = this.$table.querySelector('#LC1')

  // Use `getBoundingClientRect` instead of `offsetWidth/Height` to get accurate width and height
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
  // FONT_WIDTH = this.$test.getBoundingClientRect().width / this.$test.innerText.length
  // GUTTER.top = this.$header.getBoundingClientRect().height
  // GUTTER.left = this.$firstLineGutter.getBoundingClientRect().width + parseInt(getComputedStyle(this.$firstLine).paddingLeft, 10)
  // LINE.height = this.$firstLine.getBoundingClientRect().height
  // LINE.width = this.$firstLine.getBoundingClientRect().width
  // OFFSET_TOP = this.$content.offsetTop + this.GUTTER.top

  renderHeader() {
    const $container = document.createElement('div')
    this.$header.appendChild($container)
    return renderHeader($container)
  }

  renderFooter() {
    const $footer = document.createElement('div')
    this.$content.appendChild($footer)
    return renderFooter($footer)
  }

  renderSwitch() {
    const $switch = document.createElement('div')
    $switch.className = 'btn btn-sm'
    $switch.style.marginRight = '6px'
    $switch.addEventListener('click', () => {
      this.header.setState({
        occurrences: [],
        isDefinitionVisible: false,
        isQuickInfoVisible: false,
      })
      // option = !option
      this.isOpen = !this.isOpen
    })
    this.$actions.insertBefore($switch, this.$actions.querySelector('.BtnGroup'))
    renderSwitch($switch)
  }

  getCode() {
    const $ = <HTMLElement>document.querySelector('.blob-content')
    return $.innerText
  }

  getGutter() {
    const $testDOM = <HTMLElement>document.querySelector('#LC1 > span')
    return {
      left: $testDOM.offsetLeft,
      top: $testDOM.offsetTop
    }
  }

  getPosition(e: MouseEvent) {
    const rect = this.$code.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - this.GUTTER.left) / this.FONT_WIDTH),
      y: Math.floor((e.clientY - rect.top) / this.LINE.height)
    }
  }

  getDefinitionStyle(info: object) {
    return {
      height: `${this.LINE.height}px`,
      width: `${this.LINE.width - 10}px`,
      top: `${info.line * this.LINE.height + this.GUTTER.top}px`,
      left: `${this.GUTTER.left}px`
    }
  }

  getOccurrenceStyle(data: object) {
    return {
      height: `${this.LINE.height}px`,
      width: `${data.width * this.FONT_WIDTH}px`,
      top: `${data.range.line * this.LINE.height + this.GUTTER.top}px`,
      left: `${data.range.character * this.FONT_WIDTH + this.GUTTER.left}px`,
      backgroundColor: data.isWriteAccess ? this.WRITE_ACCESS_COLOR : this.USAGE_COLOR,
    }
  }

  getQuickInfoStyle(range: object) {
    return {
      top: `${range.line * this.LINE.height + this.GUTTER.top - 22}px`,
      left: `${range.character * this.FONT_WIDTH + this.GUTTER.left}px`,
    }
  }
}

const renderer = new GitLabRenderer()
renderer.init()

// TODO: Multi language support

import Renderer from '../renderer'

class GitLabRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.blob-content code')
  }

  // Rewrite this method, for lack of '\n' at blank line
  getCode() {
    return [].map.call(this.$code.children, (line: Element) => (<HTMLElement>line).innerText).join('\n')
  }

  getFontDOM() {
    return this.$code.querySelector('span[class]:not(.line)')
  }

  getLineWidthAndHeight() {
    const rect = document.querySelector('#LC1').getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }

  getPadding() {
    return {
      left: 10,
      top: 0
    }
  }

  getTabSize() {
    return 8
  }
}

const renderer = new GitLabRenderer()

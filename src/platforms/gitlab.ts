import Renderer from '../renderer'
import { map } from 'lodash'

// TODO: Dynamic injection

class GitLabRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.blob-content code')
  }

  // Rewrite this method, for lack of '\n' at blank line
  getCode() {
    return map(this.$code.children, line => {
      const $ = <HTMLElement>line
      return $.innerText
    }).join('\n')
  }

  getFontWidth() {
    const $ = <HTMLElement>this.$code.querySelector('span[class]:not(.line)')
    return $.getBoundingClientRect().width / $.innerText.length
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
}

const renderer = new GitLabRenderer()

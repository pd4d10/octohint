import Renderer from './renderer'
import { map } from 'lodash'

class GitLabRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.blob-content code')
  }

  getCode() {
    return map(this.$code.children, line => line.innerText).join('\n')
  }

  getFontWidth() {
    const $ = <HTMLElement>document.querySelector('#LC1 > span')
    return $.getBoundingClientRect().width / $.innerText.length
  }

  getPadding() {
    return {
      left: 10,
      top: 0
    }
  }
}

const renderer = new GitLabRenderer()

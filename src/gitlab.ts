import Renderer from './renderer'

class GitLabRenderer extends Renderer {
  renderSwitch() {
  }

  getCodeDOM() {
    return <HTMLElement>document.querySelector('.blob-content code')
  }

  getFontWidth() {
    const $ = <HTMLElement>document.querySelector('#LC1 > span')
    return $.getBoundingClientRect().width / $.innerText.length
  }

  getPadding() {
    return {
      left: 10,
      top: 10
    }
  }
}

const renderer = new GitLabRenderer()

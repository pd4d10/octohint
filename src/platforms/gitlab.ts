import Renderer from '../renderer'

class GitLabRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.blob-content code')
  }

  getCode() {
    // document.querySelector('.blob-content code').innerText miss empty line
    // Example: https://gitlab.com/gitlab-org/gitlab-ce/blob/master/app/assets/javascripts/project_avatar.js
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

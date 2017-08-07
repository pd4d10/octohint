import Renderer from '../renderer'

// FIXME: GitLab has switched to dynamic loading, can't find DOM at first time
class GitLabRenderer extends Renderer {
  getContainter() {
    return document.querySelector('.blob-content .code')
  }

  getCode() {
    // document.querySelector('.blob-content code').innerText miss empty line
    // Example: https://gitlab.com/gitlab-org/gitlab-ce/blob/master/app/assets/javascripts/project_avatar.js
    const codeDOM = document.querySelectorAll('.blob-content .line')
    const code = [].map
      .call(codeDOM, (line: Element) => (<HTMLElement>line).innerText)
      .join('\n')
    return code
  }

  getFontDOM() {
    return this.$container.querySelector('span[class]:not(.line)')
  }

  getLineWidthAndHeight() {
    const $ = document.querySelector('#LC1') as HTMLElement
    const rect = $.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
    }
  }

  getPadding() {
    return {
      left: 10,
      top: 10,
    }
  }

  getTabSize() {
    return 8
  }
}

const renderer = new GitLabRenderer()

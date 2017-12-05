import Renderer from './renderer'

export default class GitHubRenderer extends Renderer {
  getContainer() {
    // $('.blob-wrapper') is not OK because of scroll x
    return document.querySelector('.blob-wrapper table')
  }

  getFontDOM() {
    return document.querySelector('.blob-wrapper span[class]')
  }

  getLineWidthAndHeight() {
    const { width, height } = (document.querySelector('#LC1') as HTMLElement).getBoundingClientRect()
    return { width, height }
  }

  getPadding() {
    return {
      left: (document.querySelector('#L1') as HTMLElement).getBoundingClientRect().width + 10,
      top: 0,
    }
  }
}

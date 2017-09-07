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
    const $ = document.querySelector('#LC1') as HTMLElement
    const rect = $.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
    }
  }

  getPadding() {
    const gutter = document.querySelector('#L1') as HTMLElement
    return {
      left: gutter.getBoundingClientRect().width + 10,
      top: 0,
    }
  }
}

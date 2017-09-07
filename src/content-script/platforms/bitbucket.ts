import Renderer from './renderer'

export default class BitBucketRenderer extends Renderer {
  getContainer() {
    return document.querySelector('.file-source .code')
  }

  getFontDOM() {
    return this.$container.querySelector('span[class]')
  }

  getLineWidthAndHeight() {
    return {
      width: (<HTMLElement>document.querySelector('.file-source')).offsetWidth - 43,
      height: 16,
    }
  }

  getPadding() {
    return {
      left: 10,
      top: 8,
    }
  }

  getTabSize() {
    return 8
  }
}

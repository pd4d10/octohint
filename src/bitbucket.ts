import Renderer from './renderer'

class BitBucketRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.file-source .code')
  }

  getFontWidth() {
    const $ = <HTMLElement>document.querySelector('span.kd') // FIXME:
    return $.getBoundingClientRect().width / $.innerText.length
  }

  getLineWidthAndHeight() {
    return {
      width: document.querySelector('.file-source').offsetWidth - 43,
      height: 16
    }
  }

  getPadding() {
    return {
      left: 10,
      top: 8,
    }
  }
}

const renderer = new BitBucketRenderer()

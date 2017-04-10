import Renderer from './renderer'

class BitBucketRenderer extends Renderer {
  renderSwitch() {
  }

  getCodeDOM() {
    return <HTMLElement>document.querySelector('#fileview-original table')
  }

  getCode() {
    return document.querySelector('#fileview-original table .code').innerText
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
      left: 45,
      top: 8
    }
  }
}

const renderer = new BitBucketRenderer()

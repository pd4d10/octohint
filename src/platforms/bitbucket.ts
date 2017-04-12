import Renderer from '../renderer'

class BitBucketRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.file-source .code')
  }

  getFontWidth() {
    const $ = <HTMLElement>this.$code.querySelector('span[class]')
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

// Dynamic injection
// https://github.com/OctoLinker/injection/blob/master/index.js
const $DOM = document.querySelector('#source-container')

const spy = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      new BitBucketRenderer()
    }
  })
})

spy.observe($DOM, {
  attributes: true,
  childList: true,
  characterData: true
})

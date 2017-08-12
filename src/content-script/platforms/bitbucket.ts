import Renderer from './renderer'

class BitBucketRenderer extends Renderer {
  getContainer() {
    return document.querySelector('.file-source .code')
  }

  getCode() {
    return this.$container.innerText
  }

  getFontDOM() {
    return this.$container.querySelector('span[class]')
  }

  getLineWidthAndHeight() {
    return {
      width:
        (<HTMLElement>document.querySelector('.file-source')).offsetWidth - 43,
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

const renderer = new BitBucketRenderer()

// Dynamic injection
// https://github.com/OctoLinker/injection/blob/master/index.js
const spy = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      new BitBucketRenderer()
    }
  })
})

const $DOM = document.querySelector('#source-container')
if ($DOM) {
  spy.observe($DOM, {
    attributes: true,
    childList: true,
    characterData: true,
  })
}

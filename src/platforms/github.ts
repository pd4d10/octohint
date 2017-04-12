import Renderer from '../renderer'

// FIXME: Add types
// import gitHubInjection from 'github-injection'
declare var require: any
const gitHubInjection = require('github-injection')

class GitHubRenderer extends Renderer {
  getCodeDOM() {
    return document.querySelector('.blob-wrapper > table')
  }

  getFontWidth() {
    const $ = <HTMLElement>this.$code.querySelector('span[class]')
    return $.getBoundingClientRect().width / $.innerText.length
  }

  getLineWidthAndHeight() {
    const rect = document.querySelector('#LC1').getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }

  getPadding() {
    const gutter = <HTMLElement>document.querySelector('#L1')
    return {
      left: gutter.getBoundingClientRect().width + 10,
      top: 0,
    }
  }

  // renderSwitch() {
  //   const $actions = document.querySelector('.file-actions')
  //   const $switch = document.createElement('div')
  //   $switch.className = 'btn btn-sm'
  //   $switch.style.marginRight = '6px'
  //   $switch.addEventListener('click', () => {
  //     this.header.setState({
  //       occurrences: [],
  //       isDefinitionVisible: false,
  //       isQuickInfoVisible: false,
  //     })
  //     this.isOpen = !this.isOpen
  //   })
  //   $actions.insertBefore($switch, $actions.querySelector('.BtnGroup'))
  // }
}

gitHubInjection(window, (err: Error) => {
  if (err) throw err
  const renderer = new GitHubRenderer()
})

// TODO: Multi language support

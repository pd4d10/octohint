import * as path from 'path'
import * as types from '../types'
import Renderer from './renderer'

const $ = (selector: string) => document.querySelector(selector)
const $$ = (selector: string) => document.querySelectorAll(selector)

function getCurrentUrl() {
  return location.protocol + '//' + location.host + location.pathname
}

// Replace `//` with `/` to simulate file system path
function getFilePath(loc: { host: string; pathname: string } = location) {
  return '/' + loc.host + loc.pathname
}

export interface RendererParams {
  /**
   * Considering scroll-x, container must be inside the wrapper
   */
  getContainer: () => Element | null
  getFontDOM: () => Element | null
  // getHighlightColor: () => string
  getLineWidthAndHeight: () => {
    width: number
    height: number
  }
  getPadding(
    fontWidth: number,
  ): {
    left: number
    top: number
  }
  getCodeUrl: () => string
  getFileName: () => string

  /**
   * Get tab size of actually renderer dom
   * If not passed, container will be used
   */
  getTabSizeDom?: () => Element | null
  // TODO: This is pretty tricky for making GitLab and Bitbucket work
  extraBeforeRender?: () => void
}

const GitHubRenderer: RendererParams = {
  getContainer: () => $('.blob-wrapper'),
  // getHighlightColor: () => '#fffbdd',
  getFontDOM: () => $('#LC1'),
  getLineWidthAndHeight: () => ($('#LC1') as HTMLElement).getBoundingClientRect(),
  getPadding: fontWidth => ({
    left: 60 + fontWidth,
    top: 0,
  }),
  getCodeUrl: () =>
    getCurrentUrl()
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/'),
  getFileName: getFilePath,
  getTabSizeDom: () => $('.blob-wrapper table'),
}

function GithubGistRendererFactory(wrapper: HTMLElement): RendererParams {
  return {
    getContainer: () => wrapper.querySelector('.blob-wrapper'),
    getFontDOM: () => wrapper.querySelector('.blob-wrapper .blob-code'),
    getLineWidthAndHeight: () => ({ width: 918, height: 20 }),
    getPadding: fontWidth => ({
      left: 60 + fontWidth,
      top: 0,
    }),
    getCodeUrl: () => (wrapper.querySelector('.file-actions a') as HTMLAnchorElement).href,
    getFileName: () => {
      const fileName = (wrapper.querySelector('.file-info') as HTMLElement).innerText.trim()
      return path.join(getFilePath(), fileName)
    },
    getTabSizeDom: () => wrapper.querySelector('.blob-wrapper table'),
  }
}

const BitbucketRenderer: RendererParams = {
  getContainer: () => $('.view-lines'),
  getFontDOM: () => $('.view-lines span'),
  getLineWidthAndHeight: () => ({
    width: (<HTMLElement>$('.view-lines .view-line')).offsetWidth - 43,
    height: 18,
  }),
  getPadding: () => ({
    left: 0,
    top: 0,
  }),
  getCodeUrl: () => getCurrentUrl().replace('/src/', '/raw/'),
  getFileName: getFilePath,
  // extraBeforeRender: () => (($('.file-source .code pre') as HTMLElement).style.position = 'relative'),
}

// This GitLab is for old version
// TODO: New version use dynamic loading
const GitLabRenderer: RendererParams = {
  getContainer: () => $('.blob-content .code'),
  getFontDOM: () => $('#LC1'),
  getLineWidthAndHeight: () => ($('#LC1') as HTMLElement).getBoundingClientRect(),
  getPadding: () => ({
    left: 10,
    top: 0,
  }),
  getCodeUrl: () => getCurrentUrl().replace('/blob/', '/raw/'),
  getFileName: getFilePath,
  extraBeforeRender: () => {
    const $code = $('.blob-content .code code') as HTMLElement
    $code.style.position = 'relative'
    $code.style.background = 'transparent'
  },
}

export default abstract class Adapter {
  prevContainer?: Element | null

  abstract getSendMessage(): types.SendMessageToBackground
  sendMessage = this.getSendMessage()

  constructor() {
    const sendMessage = this.getSendMessage()

    // GitHub Gist
    if (/gist\.github\.com/.test(location.href)) {
      // const list = $$('.file-actions a')
      ;[].forEach.call($$('.js-gist-file-update-container'), (wrapper: HTMLElement) => {
        new Renderer(sendMessage, GithubGistRendererFactory(wrapper))
      })
      return
    }

    // GitHub
    // TODO: Dynamic import
    // May be deployed at private domain, URL
    // So use DOM selector
    this.addMutationObserver($('#js-repo-pjax-container'), GitHubRenderer)
    if (GitHubRenderer.getContainer()) {
      new Renderer(sendMessage, GitHubRenderer)
      return
    }

    // GitLab
    this.addMutationObserver($('.blob-viewer'), GitLabRenderer) // Dynamic loading
    // FIXME: Use `document.documentElement` may cause problems when DOM added by other extensions
    // this.addMutationObserver(document.documentElement, GitLabRenderer, GitLabRenderer.getContainer() !== null)
    if (GitLabRenderer.getContainer()) {
      // Direct loading, like browser go back
      new Renderer(sendMessage, GitLabRenderer)
      return
    }

    // Bitbucket
    // Seems Bitbucket already use monaco-editor to show code
    // this.addMutationObserver($('.react-monaco-editor-container'), BitbucketRenderer)
    // if (BitbucketRenderer.getContainer()) {
    //   new Renderer(sendMessage, BitbucketRenderer)
    //   return
    // }
  }

  addMutationObserver(container: Element | null, params: RendererParams, extraCondition = true) {
    if (container && extraCondition) {
      new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          console.log(mutation)
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            // This fix GitHub trigger multi mutations sometimes while dynamic loading
            // Check if current container equals to previous, if same then ignore
            const container = params.getContainer()
            if (container && this.prevContainer !== container) {
              new Renderer(this.getSendMessage(), params)
              this.prevContainer = container
            }
          }
        })
      }).observe(container, {
        attributes: true,
        childList: true,
        characterData: true,
      })
    }
  }
}

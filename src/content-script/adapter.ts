import * as path from 'path'
import { SendMessageToBackground } from '../types'
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
  getContainer: () => Element | null // Considering scroll-x, container must be inside the wrapper
  getFontDOM: () => Element | null
  // getHighlightColor: () => string
  getLineWidthAndHeight: () => {
    width: number
    height: number
  }
  getPadding(
    fontWidth: number
  ): {
    left: number
    top: number
  }
  getCodeUrl: () => string
  getFileName: () => string
  getEditorConfigUrl?: () => string
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
  getCodeUrl: () => getCurrentUrl().replace('/blob/', '/raw/'),
  // .replace('github.com', 'raw.githubusercontent.com'),
  getFileName: getFilePath,
  getEditorConfigUrl() {
    return this.getCodeUrl().replace(/(^.*?\/raw\/.*?\/).*$/, '$1') + '.editorconfig'
  },
}

function GithubGistRendererFactory(wrapper: HTMLElement): RendererParams {
  return {
    getContainer: () => wrapper.querySelector('.blob-wrapper'),
    getFontDOM: () => wrapper.querySelector('.blob-wrapper .blob-code'),
    getLineWidthAndHeight: () => ({ width: 918, height: 20 }),
    getPadding: () => ({
      left: 60,
      top: 0,
    }),
    getCodeUrl: () => (wrapper.querySelector('.file-actions a') as HTMLAnchorElement).href,
    getFileName: () => {
      const fileName = (wrapper.querySelector('.file-info') as HTMLElement).innerText.trim()
      return path.join(getFilePath(), fileName)
    },
  }
}

const BitbucketRenderer: RendererParams = {
  getContainer: () => $('.file-source .code'),
  getFontDOM: () => $('.file-source .code pre'),
  getLineWidthAndHeight: () => ({
    width: (<HTMLElement>$('.file-source')).offsetWidth - 43,
    height: 16,
  }),
  getPadding: () => ({
    left: 0,
    top: 0,
  }),
  getCodeUrl: () => getCurrentUrl().replace('/src/', '/raw/'),
  getFileName: getFilePath,
  extraBeforeRender: () => (($('.file-source .code pre') as HTMLElement).style.position = 'relative'),
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
  extraBeforeRender: () => (($('.blob-content .code code') as HTMLElement).style.position = 'relative'),
}

export default abstract class Adapter {
  abstract getSendMessage(): SendMessageToBackground
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

    // TODO: Dynamic import
    // May be deployed at private domain, URL
    // So use DOM selector
    this.addMutationObserver($('#js-repo-pjax-container'), GitHubRenderer)

    if (GitHubRenderer.getContainer()) {
      new Renderer(sendMessage, GitHubRenderer)
      return
    }

    this.addMutationObserver($('.blob-viewer'), GitLabRenderer)

    // FIXME: Use `document.documentElement` may cause problems when DOM added by other extensions
    this.addMutationObserver(document.documentElement, GitLabRenderer, GitLabRenderer.getContainer() !== null)

    if (GitLabRenderer.getContainer()) {
      new Renderer(sendMessage, GitLabRenderer)
      return
    }

    this.addMutationObserver($('#source-container'), BitbucketRenderer)

    if (BitbucketRenderer.getContainer()) {
      new Renderer(sendMessage, BitbucketRenderer)
      return
    }
  }

  addMutationObserver(container: Element | null, params: RendererParams, extraCondition = true) {
    if (container && extraCondition) {
      new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          console.log(mutation)
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            if (params.getContainer()) {
              new Renderer(this.getSendMessage(), params)
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

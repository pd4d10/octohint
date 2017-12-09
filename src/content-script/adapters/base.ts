import { SendMessageToBackground } from '../../types'
import Renderer from '../platforms/renderer'

const gitHubInjection = require('github-injection')
const $ = (selector: string) => document.querySelector(selector)
const $$ = (selector: string) => document.querySelectorAll(selector)

function getLocationPath() {
  return location.protocol + '//' + location.host + location.pathname
}

export interface RendererParams {
  getContainer: () => Element | null
  // getPositionContainer?: () => Element | null
  // getScrollLeft: () => number
  getFontDOM: () => Element | null
  // getHighlightColor: () => string
  getLineWidthAndHeight: () => {
    width: number
    height: number
  }
  getPadding: () => {
    left: number
    top: number
    // bottom: number
  }
  getCodeUrl: () => string
  getFileName: () => string
  getEditorConfigUrl?: () => string
}

const GitHubRenderer: RendererParams = {
  getContainer: () => $('.blob-wrapper'), // $('.blob-wrapper') is not OK because of scroll x
  // getContainer: () => $('.file'),
  // getScrollLeft: () => ($('.blob-wrapper') as HTMLElement).scrollLeft,
  // getHighlightColor: () => '#fffbdd',
  getFontDOM: () => $('.blob-wrapper span[class]'),
  getLineWidthAndHeight: () => ($('#LC1') as HTMLElement).getBoundingClientRect(),
  getPadding: () => ({
    left: 60,
    top: 0,
  }),
  getCodeUrl: () => getLocationPath().replace('/blob/', '/raw/'),
  getFileName: getLocationPath,
  getEditorConfigUrl() {
    return this.getCodeUrl().replace(/(^.*?\/raw\/.*?\/).*$/, '$1') + '.editorconfig'
  },
}

function GithubGistRendererFactory(wrapper: HTMLElement): RendererParams {
  return {
    getContainer: () => wrapper.querySelector('.blob-wrapper table'), // $('.blob-wrapper') is not OK because of scroll x
    getFontDOM: () => wrapper.querySelector('.blob-wrapper span[class]'),
    getLineWidthAndHeight: () => ({ width: 918, height: 20 }),
    getPadding: () => ({
      left: 60,
      top: 0,
    }),
    getCodeUrl: () => (wrapper.querySelector('.file-actions a') as HTMLAnchorElement).href,
    getFileName: () => (wrapper.querySelector('.file-actions a') as HTMLAnchorElement).href,
  }
}

const BitbucketRenderer: RendererParams = {
  getContainer: () => $('.file-source .code'),
  getFontDOM: () => $('.file-source .code span[class]'),
  getLineWidthAndHeight: () => ({
    width: (<HTMLElement>$('.file-source')).offsetWidth - 43,
    height: 16,
  }),
  getPadding: () => ({
    left: 10,
    top: 10,
  }),
  getCodeUrl: () => getLocationPath().replace('/src/', '/raw/'),
  getFileName: getLocationPath,
}

// This GitLab is for old version
// TODO: New version use dynamic loading
const GitLabRenderer: RendererParams = {
  getContainer: () => $('.blob-content .code'),
  getFontDOM: () => $('.blob-content .code span[class]:not(.line)'),
  getLineWidthAndHeight: () => ($('#LC1') as HTMLElement).getBoundingClientRect(),
  getPadding: () => ({
    left: 10,
    top: 0,
  }),
  getCodeUrl: () => getLocationPath().replace('/blob/', '/raw/'),
  getFileName: getLocationPath,
}

export default abstract class Adapter {
  abstract getSendMessage(): SendMessageToBackground

  constructor() {
    const sendMessage = this.getSendMessage()

    // GitHub Gist
    if (/gist\.github\.com/.test(location.href)) {
      const list = $$('.file-actions a')
      ;[].forEach.call($$('.js-task-list-container'), (wrapper: HTMLElement) => {
        new Renderer(sendMessage, GithubGistRendererFactory(wrapper))
      })
      return
    }

    // TODO: Dynamic import
    // May be deployed at private domain, URL
    // So use DOM selector
    if (GitHubRenderer.getContainer()) {
      gitHubInjection(window, (err: Error) => {
        if (err) throw err
        new Renderer(sendMessage, GitHubRenderer)
      })
      return
    }

    if (GitLabRenderer.getContainer()) {
      new Renderer(sendMessage, GitLabRenderer)
      return
    }

    if (BitbucketRenderer.getContainer()) {
      new Renderer(sendMessage, BitbucketRenderer)

      const $DOM = $('#source-container')
      if ($DOM) {
        new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
              if (BitbucketRenderer.getContainer()) {
                new Renderer(sendMessage, BitbucketRenderer)
              }
            }
          })
        }).observe($DOM, {
          attributes: true,
          childList: true,
          characterData: true,
        })
      }
      return
    }
  }
}

import { SendMessageToBackground } from '../../types'
import Renderer from '../platforms/renderer'

const gitHubInjection = require('github-injection')
const $ = (selector: string) => document.querySelector(selector)
const $$ = (selector: string) => document.querySelectorAll(selector)

export interface RendererParams {
  getContainer: () => Element | null
  getFontDOM: () => Element | null
  getLineWidthAndHeight: () => {
    width: number
    height: number
  }
  getPadding: () => {
    left: number
    top: number
  }
  getCodeUrl: () => string
  getFileName: () => string
}

const GitHubRenderer: RendererParams = {
  getContainer: () => $('.blob-wrapper table'), // $('.blob-wrapper') is not OK because of scroll x
  getFontDOM: () => $('.blob-wrapper span[class]'),
  getLineWidthAndHeight: () => ($('#LC1') as HTMLElement).getBoundingClientRect(),
  getPadding: () => ({
    left: ($('#L1') as HTMLElement).getBoundingClientRect().width + 10,
    top: 0,
  }),
  getCodeUrl: () => location.href.replace('/blob/', '/raw/'),
  getFileName: () => location.href,
}

function GithubGistRendererFactory(wrapper: HTMLElement): RendererParams {
  return {
    getContainer: () => wrapper.querySelector('.blob-wrapper table'), // $('.blob-wrapper') is not OK because of scroll x
    getFontDOM: () => wrapper.querySelector('.blob-wrapper span[class]'),
    getLineWidthAndHeight: () => ({ width: 918, height: 20 }),
    getPadding: () => ({
      left: 50,
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
    top: 8,
  }),
  getCodeUrl: () => '', // TODO:
  getFileName: () => location.href,
}

const GitLabRenderer: RendererParams = {
  getContainer: () => $('.blob-content .code'),
  getFontDOM: () => $('.blob-content .code span[class]:not(.line)'),
  getLineWidthAndHeight: () => ($('#LC1') as HTMLElement).getBoundingClientRect(),
  getPadding: () => ({
    left: 10,
    top: 10,
  }),
  getCodeUrl: () => location.href.replace('/blob/', '/raw/'),
  getFileName: () => location.href,
}

export default abstract class Adapter {
  abstract getSendMessage(): SendMessageToBackground

  constructor() {
    const sendMessage = this.getSendMessage()

    if (/gist\.github\.com/.test(location.href)) {
      const list = $$('.file-actions a')
      ;[].forEach.call($$('.js-task-list-container'), (wrapper: HTMLElement) => {
        new Renderer(sendMessage, GithubGistRendererFactory(wrapper))
      })
    }

    // TODO: Dynamic import
    // May be deployed at private domain, URL
    // So use DOM selector
    if (GitHubRenderer.getContainer()) {
      gitHubInjection(window, (err: Error) => {
        if (err) throw err
        new Renderer(sendMessage, GitHubRenderer)
      })
    } else if (GitLabRenderer.getContainer()) {
      new Renderer(sendMessage, GitLabRenderer)
    } else if (BitbucketRenderer.getContainer()) {
      new Renderer(sendMessage, BitbucketRenderer)

      const $DOM = $('#source-container')
      if ($DOM) {
        new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
              new Renderer(sendMessage, BitbucketRenderer)
            }
          })
        }).observe($DOM, {
          attributes: true,
          childList: true,
          characterData: true,
        })
      }
    }
  }
}

import { SendMessageToBackground } from '../types'
import GitHubRenderer from './platforms/github'
import BitbucketRenderer from './platforms/bitbucket'
import GitLabRenderer from './platforms/gitlab'

const gitHubInjection = require('github-injection')

export default class Adapter {
  getSendMessage(): SendMessageToBackground {
    return chrome.runtime.sendMessage
  }

  constructor() {
    const sendMessage = this.getSendMessage()

    // TODO: Dynamic import
    if (document.querySelector('.blob-wrapper')) {
      gitHubInjection(window, (err: Error) => {
        if (err) throw err
        new GitHubRenderer(sendMessage)
      })
    } else if (document.querySelector('.blob-content')) {
      new GitLabRenderer(sendMessage)
    } else if (document.querySelector('.file-source')) {
      new BitbucketRenderer(sendMessage)

      const $DOM = document.querySelector('#source-container')
      if ($DOM) {
        new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
              new BitbucketRenderer(sendMessage)
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

new Adapter()

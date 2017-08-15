import { ContentMessage, BackgroundMessage } from '../types'
import GitHubRenderer from './platforms/github'
import BitBucketRenderer from './platforms/bitbucket'
import GitLabRenderer from './platforms/gitlab'

const gitHubInjection = require('github-injection')

// Firefox will fail to get `window.chrome`
// const isChrome = window.chrome && window.chrome.runtime
const isSafari = window.safari && window.safari.self && window.safari.self.addEventListener

function sendMessage(data: ContentMessage, cb: (message: BackgroundMessage) => void) {
  if (isSafari) {
    window.OCTOHINT_ON_MESSAGE = cb
    safari.self.tab.dispatchMessage('from page', data)
    return
  }

  chrome.runtime.sendMessage(data, cb)
}

// For Safari
if (isSafari) {
  window.OCTOHINT_ON_MESSAGE = () => {}
  safari.self.addEventListener(
    'message',
    res => {
      window.OCTOHINT_ON_MESSAGE(res.message)
    },
    false
  )
}

// TODO: Dynamic import
if (document.querySelector('.blob-wrapper')) {
  gitHubInjection(window, (err: Error) => {
    if (err) throw err
    const renderer = new GitHubRenderer(sendMessage)
  })
} else if (document.querySelector('.blob-content')) {
  const renderer = new GitLabRenderer(sendMessage)
} else if (document.querySelector('.file-source')) {
  const renderer = new BitBucketRenderer(sendMessage)

  // Dynamic injection
  // https://github.com/OctoLinker/injection/blob/master/index.js
  const spy = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        new BitBucketRenderer(sendMessage)
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
}

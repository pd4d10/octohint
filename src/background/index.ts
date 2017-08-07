import * as ts from 'typescript'
import Service from './services/service'
import createService from './services'

// https://github.com/buunguyen/octotree/blob/61b54094ff62a725f58cff6d2dae019f8ee68562/src/config/chrome/background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return

  chrome.tabs.executeScript(
    tabId,
    {
      code:
        'var injected = window.octohintinjected; window.octohintInjected = true; injected;',
    },
    res => {
      if (chrome.runtime.lastError || res[0]) return
      chrome.tabs.executeScript(
        tabId,
        {
          file: 'dist/sentry.js',
        },
        () => {
          chrome.tabs.executeScript(tabId, {
            file: 'dist/content-script.js',
          })
        }
      )
    }
  )
})

interface Services {
  [key: string]: Service
}

const services: Services = {}
const TIMEOUT = 1000 * 60 * 5 // 5min

const isChrome = window.chrome && window.chrome.runtime

function handleMessage(cb) {
  if (isChrome) {
    chrome.runtime.onMessage.addListener(cb)
    return
  }

  safari.application.addEventListener(
    'message',
    res => {
      cb(res.message, undefined, message => {
        res.target.page.dispatchMessage('test', message)
      })
    },
    false
  )
}

handleMessage((message, sender, sendResponse) => {
  const fileName = message.file.replace(/js$/, 'ts').replace(/jsx$/, 'tsx') // FIXME:
  const service = services[fileName]

  if (!service && !message.code) {
    sendResponse({
      error: 'no-code',
    })
    return
  }

  switch (message.type) {
    case 'service': {
      sendResponse({}) // Trigger for Safari
      if (service) {
        return
      }

      const { file, code } = message
      services[fileName] = createService(fileName, code)

      chrome.browserAction.setIcon({
        path: 'icon.png',
      })
      chrome.browserAction.setTitle({
        title: 'Octohint is active.',
      })

      // Add a timeout to delete service to prevent memory leak
      setTimeout(() => {
        delete services[fileName]
      }, TIMEOUT)
      return
    }
    case 'occurrence': {
      const { x, y } = message.position
      const occurrences = service.getOccurrences(y, x)

      let info: ts.LineAndCharacter
      if (message.meta) {
        info = service.getDefinition(y, x)
      }

      sendResponse({
        occurrences,
        info,
      })
      return
    }
    case 'quickInfo': {
      const { x, y } = message.position
      const data = service.getQuickInfo(y, x)
      sendResponse({ data })
      return
    }
    default:
      return
  }
})

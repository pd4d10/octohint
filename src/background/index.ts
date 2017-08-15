import * as ts from 'typescript'
import Service from './services/service'
import { createService } from './services'
import { MessageType, ContentMessage, BackgroundMessage } from '../types'

const isChrome = window.chrome && window.chrome.runtime

// https://github.com/buunguyen/octotree/blob/61b54094ff62a725f58cff6d2dae019f8ee68562/src/config/chrome/background.js
if (isChrome) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return

    chrome.tabs.executeScript(
      tabId,
      {
        code: 'var injected = window.octohintinjected; window.octohintInjected = true; injected;',
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
}

interface Services {
  [key: string]: Service
}

const services: Services = {}
const TIMEOUT = 1000 * 60 * 5 // 5min

function addListener(cb: any) {
  if (isChrome) {
    chrome.runtime.onMessage.addListener(cb)
    return
  }

  safari.application.addEventListener(
    'message',
    (res: any) => {
      cb(res.message, undefined, (message: any) => {
        res.target.page.dispatchMessage('test', message)
      })
    },
    false
  )
}

function handleMessage(
  message: ContentMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (message: BackgroundMessage) => void
) {
  const fileName = message.file
  const service = services[fileName]

  if (!service && !message.code) {
    sendResponse({
      error: 'no-code',
    })
    return
  }

  switch (message.type) {
    case MessageType.service: {
      sendResponse({}) // Trigger for Safari
      if (service) return

      services[fileName] = createService(fileName, message.code)

      // chrome.browserAction.setIcon({
      //   path: 'icon.png',
      // })
      // chrome.browserAction.setTitle({
      //   title: 'Octohint is active.',
      // })

      // Add a timeout to delete service to prevent memory leak
      setTimeout(() => {
        delete services[fileName]
      }, TIMEOUT)
      return
    }
    case MessageType.occurrence: {
      const { x, y } = message.position

      sendResponse({
        occurrences: service.getOccurrences(y, x),
        info: message.meta ? service.getDefinition(y, x) : undefined,
      })
      return
    }
    case MessageType.quickInfo: {
      const { x, y } = message.position
      const data = service.getQuickInfo(y, x)
      sendResponse({ data })
      return
    }
    default:
      return
  }
}

addListener(handleMessage)

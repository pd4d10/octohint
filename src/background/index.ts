import * as ts from 'typescript'
import { isTsFile } from '../utils'
import { createService, createTSService } from './services'
import { MessageType, MessageFromContentScript, MessageFromBackground, AddBackgroundListener } from '../types'

const services: {
  [key: string]: any
} = {}
const TIMEOUT = 1000 * 60 * 5 // 5min

export default class Adapter {
  getAddListener(): AddBackgroundListener {
    return cb => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        cb(message, sendResponse)
      })
    }
  }

  constructor() {
    const addListener = this.getAddListener()
    addListener(this.handleMessage)
    this.addTabUpdateListener()
  }

  addTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status !== 'complete') return

      const code = 'var injected = window.octohintinjected; window.octohintInjected = true; injected;'
      chrome.tabs.executeScript(tabId, { code }, res => {
        if (chrome.runtime.lastError || res[0]) return

        const file = 'dist/sentry.js'
        chrome.tabs.executeScript(tabId, { file }, () => {
          chrome.tabs.executeScript(tabId, {
            file: 'dist/content-script.js',
          })
        })
      })
    })
  }

  handleMessage(message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) {
    const fileName = message.file
    let service
    if (isTsFile(fileName)) {
      service = services['ts']
    } else {
      service = services[fileName]
    }

    // if (!service && !message.code) {
    //   sendResponse({
    //     error: 'no-code',
    //   })
    //   return
    // }

    switch (message.type) {
      case MessageType.service: {
        sendResponse({}) // Trigger for Safari

        if (isTsFile(fileName)) {
          services['ts'] = createService(fileName)
        } else if (!service) {
          services[fileName] = createService(fileName)
        }

        // Add a timeout to delete service to prevent memory leak
        // setTimeout(() => {
        //   delete services[fileName]
        // }, TIMEOUT)

        // chrome.browserAction.setIcon({
        //   path: 'icon.png',
        // })
        // chrome.browserAction.setTitle({
        //   title: 'Octohint is active.',
        // })

        return
      }
      case MessageType.occurrence: {
        const { x, y } = message.position
        sendResponse({
          occurrences: service.getOccurrences(y, x, message.file),
          info: message.meta ? service.getDefinition(y, x, message.file) : undefined,
        })
        return
      }
      case MessageType.quickInfo: {
        const { x, y } = message.position
        const data = service.getQuickInfo(y, x, message.file)
        sendResponse({ data })
        return
      }
      default:
        return
    }
  }
}

new Adapter()

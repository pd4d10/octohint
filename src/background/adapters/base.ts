import * as ts from 'typescript'
import { isTsFile } from '../../utils'
import { createService } from '../services'
import TsService from '../services/typescript'
import { MessageType, MessageFromContentScript, MessageFromBackground, AddBackgroundListener } from '../../types'
import { Service } from '../services/base'

const TIMEOUT = 1000 * 60 * 5 // 5min

export default abstract class Adapter {
  services: {
    [key: string]: Service
  } = {}

  abstract addListener(
    cb: (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => void
  ): void
  abstract addTabUpdateListener(): void

  constructor() {
    this.addListener(this.handleMessage)
    this.addTabUpdateListener()
  }

  handleMessage = (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => {
    console.log('Message:', message)
    const { file } = message
    let service: Service
    if (isTsFile(file)) {
      if (!this.services.ts) {
        this.services.ts = new TsService(file)
      } else {
        ;(this.services.ts as TsService).createService(file)
      }
      service = this.services.ts
    } else {
      if (!this.services[file]) {
        this.services[file] = createService(file)
      }
      service = this.services[file]
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

        // if (isTsFile(file)) {
        //   services.ts = new TsService(file)
        // } else if (!service) {
        //   services[file] = createService(file)
        // }

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
          occurrences: service.getOccurrences(message.file, y, x),
          info: message.meta ? service.getDefinition(message.file, y, x) : undefined,
        })
        return
      }
      case MessageType.quickInfo: {
        const { x, y } = message.position
        sendResponse({ data: service.getQuickInfo(message.file, y, x) })
        return
      }
      default:
        return
    }
  }
}

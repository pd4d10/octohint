import * as ts from 'typescript'
import { isTsFile } from '../../utils'
import { createService } from '../services'
import TsService from '../services/typescript'
import { MessageType, MessageFromContentScript, MessageFromBackground, AddBackgroundListener } from '../../types'
import { MultiFileService } from '../services/base'

const TIMEOUT = 1000 * 60 * 5 // 5min

export default abstract class Adapter {
  services: { [file: string]: MultiFileService } = {}
  ts: TsService

  abstract addListener(
    cb: (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => void
  ): void
  abstract addTabUpdateListener(): void

  constructor() {
    this.addListener(this.handleMessage)
    this.addTabUpdateListener()
  }

  handleMessage = (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => {
    const { file, codeUrl } = message
    let service
    if (isTsFile(file)) {
      if (!this.ts) {
        this.ts = new TsService(file, codeUrl)
      } else {
        this.ts.createService(file, codeUrl)
      }
      service = this.ts
    } else {
      if (!this.services[file]) {
        this.services[file] = createService(file)

        // Add a timeout to delete service to prevent memory leak
        setTimeout(() => {
          delete this.services[file]
        }, TIMEOUT)
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

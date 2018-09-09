import * as ts from 'typescript'
import { createService } from './services'
import TsService from './services/typescript'
import { MessageType, MessageFromContentScript, MessageFromBackground, AddBackgroundListener } from '../types'
import { MultiFileService } from './services/base'

const TIMEOUT = 1000 * 60 * 5 // 5min

export default abstract class Adapter {
  services: { [file: string]: MultiFileService } = {}
  ts: TsService

  abstract addListener(
    cb: (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => void,
  ): void
  abstract addTabUpdateListener(): void

  constructor() {
    this.addListener(this.handleMessage)
    this.addTabUpdateListener()
  }

  getExtension(path: string) {
    return path.replace(/.*\.(.*?)$/, '$1')
  }

  handleMessage = (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => {
    const send = (...args) => {
      console.log(message, ...args)
      sendResponse(...args)
    }

    // const { file, codeUrl, tabSize } = message
    let service
    const ext = this.getExtension(message.file)
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      if (!this.ts) {
        this.ts = new TsService(message)
      } else {
        this.ts.createService(message)
      }
      service = this.ts
    } else {
      if (!this.services[message.file]) {
        this.services[message.file] = createService(ext, message)

        // Add a timeout to delete service to prevent memory leak
        setTimeout(() => {
          delete this.services[message.file]
        }, TIMEOUT)
      }
      service = this.services[message.file]
    }

    // if (!service && !message.code) {
    //   sendResponse({
    //     error: 'no-code',
    //   })
    //   return
    // }

    switch (message.type) {
      case MessageType.service: {
        send({}) // Trigger for Safari

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
        send({
          occurrences: service.getOccurrences(message.file, y, x),
          info: message.meta ? service.getDefinition(message.file, y, x) : undefined,
        })
        return
      }
      case MessageType.quickInfo: {
        const { x, y } = message.position
        send({ data: service.getQuickInfo(message.file, y, x) })
        return
      }
      default:
        send({})
    }
  }
}

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

    const { file, codeUrl, editorConfigUrl } = message
    let service
    const ext = this.getExtension(file)
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      if (!this.ts) {
        this.ts = new TsService(file, codeUrl, editorConfigUrl)
      } else {
        this.ts.createService(file, codeUrl, editorConfigUrl)
      }
      service = this.ts
    } else {
      if (!this.services[file]) {
        this.services[file] = createService(ext, file, codeUrl, editorConfigUrl)

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

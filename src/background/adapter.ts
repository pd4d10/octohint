import { createService } from './services'
import { TsService } from './services/typescript'
import { MultipleFileService } from './services/base'
import {
  ContentMessage,
  BackgroundMessage,
  MessageType,
  BackgroundMessageOfOccurrence,
  BackgroundMessageOfQuickInfo,
} from '../types'

const TIMEOUT = 1000 * 60 * 5 // 5min

export default abstract class Adapter {
  ts = new TsService()
  services: { [file: string]: MultipleFileService } = {}

  abstract addListener(
    cb: (message: ContentMessage, sendResponse: (message: BackgroundMessage) => void) => void,
  ): void

  constructor() {
    this.addListener(this.handleMessage)
  }

  getExtension(path: string) {
    return path.replace(/.*\.(.*?)$/, '$1')
  }

  handleMessage = (message: ContentMessage, sendResponse: (message: BackgroundMessage) => void) => {
    // const { file, codeUrl, tabSize } = message
    let service
    const ext = this.getExtension(message.file)
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      if (!this.ts) {
        this.ts = new TsService()
      }
      this.ts.createService(message)
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

    let response: BackgroundMessage

    switch (message.type) {
      case MessageType.service: {
        response = {} // Trigger for Safari

        // chrome.browserAction.setIcon({
        //   path: 'icon.png',
        // })
        // chrome.browserAction.setTitle({
        //   title: 'Octohint is active.',
        // })

        break
      }
      case MessageType.occurrence: {
        const info = {
          file: message.file,
          line: message.position.y,
          character: message.position.x,
        }
        response = {
          occurrences: service.getOccurrences(info),
          info: message.meta ? service.getDefinition(info) : undefined,
        } as BackgroundMessageOfOccurrence
        break
      }
      case MessageType.quickInfo: {
        const info = {
          file: message.file,
          line: message.position.y,
          character: message.position.x,
        }
        response = {
          data: service.getQuickInfo(info),
        } as BackgroundMessageOfQuickInfo
        break
      }
      default:
        response = {}
    }

    console.log(message, response)
    sendResponse(response)
  }
}

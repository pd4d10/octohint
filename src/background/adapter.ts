import { createService } from './services'
import TsService from './services/typescript'
import * as types from '../types'
import { MultiFileService } from './services/base'

const TIMEOUT = 1000 * 60 * 5 // 5min

export default abstract class Adapter {
  services: { [file: string]: MultiFileService } = {}
  ts = new TsService()

  abstract addListener(
    cb: (message: types.ContentMessage, sendResponse: (message: types.BackgroundMessage) => void) => void,
  ): void
  abstract addTabUpdateListener(): void

  constructor() {
    this.addListener(this.handleMessage)
    this.addTabUpdateListener()
  }

  getExtension(path: string) {
    return path.replace(/.*\.(.*?)$/, '$1')
  }

  handleMessage = (message: types.ContentMessage, sendResponse: (message: types.BackgroundMessage) => void) => {
    // const { file, codeUrl, tabSize } = message
    let service
    const ext = this.getExtension(message.file)
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
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

    let response: types.BackgroundMessage

    switch (message.type) {
      case types.Message.service: {
        response = {} // Trigger for Safari

        // chrome.browserAction.setIcon({
        //   path: 'icon.png',
        // })
        // chrome.browserAction.setTitle({
        //   title: 'Octohint is active.',
        // })

        break
      }
      case types.Message.occurrence: {
        const info = {
          file: message.file,
          line: message.position.y,
          character: message.position.x,
        }
        response = {
          occurrences: service.getOccurrences(info),
          info: message.meta ? service.getDefinition(info) : undefined,
        } as types.BackgroundMessageOfOccurrence
        break
      }
      case types.Message.quickInfo: {
        const info = {
          file: message.file,
          line: message.position.y,
          character: message.position.x,
        }
        response = {
          data: service.getQuickInfo(info),
        } as types.BackgroundMessageOfQuickInfo
        break
      }
      default:
        response = {}
    }

    console.log(message, response)
    sendResponse(response)
  }
}

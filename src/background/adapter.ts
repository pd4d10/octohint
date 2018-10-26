import { createService } from './services'
import TsService from './services/typescript'
import * as types from '../types'
import { MultiFileService } from './services/base'

const TIMEOUT = 1000 * 60 * 5 // 5min

export default abstract class Adapter {
  services: { [file: string]: MultiFileService } = {}
  ts = new TsService()

  abstract addListener(
    cb: (message: types.MessageFromContentScript, sendResponse: (message: types.MessageFromBackground) => void) => void,
  ): void
  abstract addTabUpdateListener(): void

  constructor() {
    this.addListener(this.handleMessage)
    this.addTabUpdateListener()
  }

  getExtension(path: string) {
    return path.replace(/.*\.(.*?)$/, '$1')
  }

  handleMessage = (
    message: types.MessageFromContentScript,
    sendResponse: (message: types.MessageFromBackground) => void,
  ) => {
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

    let response: types.MessageFromBackground

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
        const { x, y } = message.position
        response = {
          occurrences: service.getOccurrences(message.file, y, x),
          info: message.meta ? service.getDefinition(message.file, y, x) : undefined,
        }
        break
      }
      case types.Message.quickInfo: {
        const { x, y } = message.position
        response = {
          data: service.getQuickInfo(message.file, y, x),
        }
        break
      }
      default:
        response = {}
    }

    console.log(message, response)
    sendResponse(response)
  }
}

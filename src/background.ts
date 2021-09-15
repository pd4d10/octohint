import { TsService } from './services/typescript'
import { BaseService } from './services/base'
import { ContentMessage, BackgroundMessage } from './types'
import { CSSService, LESSService, SCSSService } from './services/css'
import SimpleService from './services/simple'

const TIMEOUT = 1000 * 60 * 5 // 5min

const ts = new TsService()
const services = {} as { [file: string]: BaseService }

function handleMessage(
  message: ContentMessage,
  sendResponse: (message: BackgroundMessage) => void,
) {
  let service: BaseService
  const ext = message.file.split('.').slice(-1)[0]

  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    ts.createService(message)
    service = ts
  } else {
    if (!services[message.file]) {
      if (ext === 'less') {
        service = new LESSService(message)
      } else if (ext === 'scss') {
        service = new SCSSService(message)
      } else if (ext === 'css') {
        service = new CSSService(message)
      } else {
        return new SimpleService(message)
      }

      services[message.file] = service

      // Add a timeout to delete service to prevent memory leak
      setTimeout(() => {
        delete services[message.file]
      }, TIMEOUT)
    }

    service = services[message.file]
  }

  if (message.type === 'occurrence') {
    const info = {
      file: message.file,
      line: message.position.y,
      character: message.position.x,
    }
    sendResponse({
      occurrences: service.getOccurrences(info),
      info: message.meta ? service.getDefinition(info) : undefined,
    })
  } else if (message.type === 'quickInfo') {
    const info = {
      file: message.file,
      line: message.position.y,
      character: message.position.x,
    }
    sendResponse({
      data: service.getQuickInfo(info),
    })
  } else {
    sendResponse({}) // Trigger for Safari

    // chrome.browserAction.setIcon({
    //   path: 'icon.png',
    // })
    // chrome.browserAction.setTitle({
    //   title: 'Octohint is active.',
    // })
  }

  console.log(message)

  // TODO: Do not set it every time
  // chrome.browserAction.setIcon({ tabId: sender.tab.id, path: 'icons/active.png' })
  // chrome.browserAction.setTitle({ title: 'Octohint works' })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('runtime.onMessage', message, sender)
  if (sender.tab?.id) {
    handleMessage(message, sendResponse)
  }
})

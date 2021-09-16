import { tsService } from './services/typescript'
import { BaseService } from './services/base'
import { HintRequest, HintResponse } from './types'
import { CSSService, LESSService, SCSSService } from './services/css'
import SimpleService from './services/simple'

const TIMEOUT = 1000 * 60 * 5 // 5min

const services = {} as { [file: string]: BaseService }

function handleRequest(req: HintRequest): HintResponse {
  let service: BaseService
  const ext = req.file.split('.').slice(-1)[0]

  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    // TODO: mjs, cjs
    tsService.createService(req)
    service = tsService
  } else {
    if (!services[req.file]) {
      if (ext === 'less') {
        service = new LESSService(req)
      } else if (ext === 'scss') {
        service = new SCSSService(req)
      } else if (ext === 'css') {
        service = new CSSService(req)
      } else {
        service = new SimpleService(req)
      }

      services[req.file] = service

      // Add a timeout to delete service to prevent memory leak
      setTimeout(() => {
        delete services[req.file]
      }, TIMEOUT)
    }

    service = services[req.file]
  }

  if (req.type === 'click') {
    return {
      occurrences: service.getOccurrences(req),
      definition: req.meta ? service.getDefinition(req) : undefined,
    }
  } else if (req.type === 'hover') {
    return {
      quickInfo: service.getQuickInfo(req),
    }
  } else {
    return {}
    // chrome.browserAction.setIcon({
    //   path: 'icon.png',
    // })
    // chrome.browserAction.setTitle({
    //   title: 'Octohint is active.',
    // })
  }

  // TODO: Do not set it every time
  // chrome.browserAction.setIcon({ tabId: sender.tab.id, path: 'icons/active.png' })
  // chrome.browserAction.setTitle({ title: 'Octohint works' })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('runtime.onMessage', message, sender)
  // if (sender.tab?.id) {
  const res = handleRequest(message)
  sendResponse(res)
  // }
})

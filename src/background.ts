import * as ts from 'typescript'
import Service from './service'

interface Services {
  [key: string]: Service
}

const services: Services = {}
const TIMEOUT = 1000 * 60 * 5 // 5min

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const fileName = message.file + '.ts' // FIXME:
  const service = services[fileName]

  if (!service && !message.code) {
    sendResponse({
      error: 'no-code'
    })
    return
  }

  switch (message.type) {
    case 'service': {
      if (service) {
        return
      }

      const { file, code } = message
      services[fileName] = new Service(fileName, code)

      // Add a timeout to delete service to prevent memory leak
      setTimeout(() => {
        delete services[fileName]
      }, TIMEOUT)
      return
    }
    case 'occurrence': {
      const { x, y } = message.position
      const occurrences = service.getOccurrences(y, x)

      let info: ts.LineAndCharacter
      if (message.meta) {
        info = service.getDefinition(y, x)
      }

      sendResponse({
        occurrences,
        info,
      })
      return
    }
    case 'quickInfo': {
      const { x, y } = message.position
      const data = service.getQuickInfo(y, x)
      sendResponse({ data })
      return
    }
    default:
      return
  }
})

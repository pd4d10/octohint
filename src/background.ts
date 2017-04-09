import * as ts from 'typescript'
import Service from './service'

let service: Service

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  switch (message.type) {
    case 'service': {
      service = new Service(message.data)
      sendResponse('service created')
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
    }
    case 'quickInfo': {
      const { x, y } = message.position
      const data = service.getQuickInfo(y, x)
      sendResponse({ data })
    }
    default:
      return
  }
})

import * as ts from 'typescript'
import Service from './service'

const services = {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const fileName = message.file + '.ts'
  const service = services[fileName]

  console.log(message)
  console.log(services)
  switch (message.type) {
    case 'service': {
      if (!service) {
        const { file, data } = message
        services[fileName] = new Service(fileName, data)

        // TODO: Add a timeout to delete service, to prevent memory leak

        sendResponse(fileName, 'service created')
      }
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

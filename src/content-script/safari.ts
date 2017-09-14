import Adapter from './index'
import { MessageFromBackground, SendMessageToBackground } from '../types'

declare var OCTOHINT_ON_MESSAGE: (message: MessageFromBackground) => void

class SafariAdapter extends Adapter {
  getSendMessage(): SendMessageToBackground {
    return (data, cb) => {
      OCTOHINT_ON_MESSAGE = cb
      safari.self.tab.dispatchMessage('from page', data)
    }
  }

  constructor() {
    safari.self.addEventListener(
      'message',
      (res: { message: MessageFromBackground }) => {
        OCTOHINT_ON_MESSAGE(res.message)
      },
      false
    )
    super()
  }
}

new SafariAdapter()

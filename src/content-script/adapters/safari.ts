import 'safari-extension-content'
import Adapter from './base'
import { MessageFromBackground, SendMessageToBackground } from '../../types'

// declare var OCTOHINT_ON_MESSAGE: (message: MessageFromBackground) => void

window.OCTOHINT_ON_MESSAGE = () => {}

export default class SafariAdapter extends Adapter {
  getSendMessage(): SendMessageToBackground {
    return (data, cb) => {
      window.OCTOHINT_ON_MESSAGE = cb
      safari.self.tab.dispatchMessage('from page', data)
    }
  }

  constructor() {
    safari.self.addEventListener(
      'message',
      (res: { message: MessageFromBackground }) => {
        window.OCTOHINT_ON_MESSAGE(res.message)
      },
      false
    )
    super()
  }
}

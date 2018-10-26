import Adapter from './adapter'
import * as types from '../types'

declare global {
  interface Window {
    OCTOHINT_ON_MESSAGE: (message: types.MessageFromBackground) => void
  }
}

window.OCTOHINT_ON_MESSAGE = () => {}

class SafariAdapter extends Adapter {
  getSendMessage(): types.SendMessageToBackground {
    return (data, cb) => {
      window.OCTOHINT_ON_MESSAGE = cb
      safari.self.tab.dispatchMessage('from page', data)
    }
  }

  constructor() {
    safari.self.addEventListener(
      'message',
      (res: { message: types.MessageFromBackground }) => {
        window.OCTOHINT_ON_MESSAGE(res.message)
      },
      false,
    )
    super()
  }
}

new SafariAdapter()

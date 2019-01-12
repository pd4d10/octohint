import Adapter from '../../content-script/adapter'
import * as types from '../../types'

declare global {
  interface Window {
    OCTOHINT_ON_MESSAGE: (message: types.BackgroundMessage) => void
  }
}

window.OCTOHINT_ON_MESSAGE = () => {}

class SafariAdapter extends Adapter {
  getSendMessage(): types.SendMessageToBackground {
    return data =>
      new Promise(resolve => {
        window.OCTOHINT_ON_MESSAGE = resolve
        safari.self.tab.dispatchMessage('from page', data)
      })
  }

  constructor() {
    safari.self.addEventListener(
      'message',
      (res: { message: types.BackgroundMessage }) => {
        window.OCTOHINT_ON_MESSAGE(res.message)
      },
      false,
    )
    super()
  }
}

new SafariAdapter()

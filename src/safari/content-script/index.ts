import Adapter from '../../content-script/adapter'
import { BackgroundMessage, SendMessageToBackground } from '../../types'

declare global {
  interface Window {
    OCTOHINT_ON_MESSAGE: (message: BackgroundMessage) => void
  }
}

window.OCTOHINT_ON_MESSAGE = () => {}

class SafariAdapter extends Adapter {
  getSendMessage(): SendMessageToBackground {
    return data =>
      new Promise(resolve => {
        window.OCTOHINT_ON_MESSAGE = resolve
        safari.self.tab.dispatchMessage('from page', data)
      })
  }

  constructor() {
    safari.self.addEventListener(
      'message',
      (res: { message: BackgroundMessage }) => {
        window.OCTOHINT_ON_MESSAGE(res.message)
      },
      false,
    )
    super()
  }
}

new SafariAdapter()

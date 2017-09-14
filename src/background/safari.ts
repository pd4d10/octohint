import Adapter from './index'
import { MessageFromContentScript, MessageFromBackground, AddBackgroundListener } from '../types'

class SafariAdapter extends Adapter {
  getAddListener(): AddBackgroundListener {
    return cb => {
      safari.application.addEventListener(
        'message',
        (res: { message: MessageFromContentScript }) => {
          cb(res.message, (message: MessageFromBackground) => {
            res.target.page.dispatchMessage('test', message)
          })
        },
        false
      )
    }
  }

  // Not supported at Safari
  addTabUpdateListener() {}
}

new SafariAdapter()

import 'safari-extension'
import BaseAdapter from './base'
// import { AddBackgroundListener } from '../../types'

export default class SafariAdapter extends BaseAdapter {
  addListener(cb) {
    safari.application.addEventListener(
      'message',
      (e: SafariExtensionMessageEvent) => {
        cb(e.message, message => {
          const tab = e.target as SafariBrowserTab
          tab.page.dispatchMessage('', message)
        })
      },
      false
    )
  }

  // Not supported at Safari
  addTabUpdateListener() {}
}

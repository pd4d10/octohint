import Adapter from '../../background/adapter'

class SafariAdapter extends Adapter {
  addListener(cb: any) {
    safari.application.addEventListener(
      'message',
      (e: SafariExtensionMessageEvent) => {
        cb(e.message, message => {
          const tab = e.target as SafariBrowserTab
          tab.page.dispatchMessage('message', message)
        })
      },
      false,
    )
  }
}

new SafariAdapter()

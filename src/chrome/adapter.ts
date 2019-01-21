import Adapter from '../background/adapter'

export class ChromeAdapter extends Adapter {
  addListener(cb: any) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // console.log('runtime.onMessage', message, sender)

      if (sender.tab && sender.tab.id) {
        cb(message, sendResponse)
      }

      // TODO: Do not set it every time
      // chrome.browserAction.setIcon({ tabId: sender.tab.id, path: 'icons/active.png' })
      // chrome.browserAction.setTitle({ title: 'Octohint works' })
    })
  }
}

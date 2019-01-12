import Adapter from '../content-script/adapter'
import { SendMessageToBackground } from '../types'

class ChromeAdapter extends Adapter {
  getSendMessage(): SendMessageToBackground {
    return data =>
      new Promise(resolve => {
        chrome.runtime.sendMessage(data, resolve)
      })
  }
}

new ChromeAdapter()

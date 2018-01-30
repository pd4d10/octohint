import Adapter from './adapter'

class ChromeAdapter extends Adapter {
  getSendMessage() {
    return chrome.runtime.sendMessage
  }
}

new ChromeAdapter()

import Adapter from '../content-script/adapter'

class ChromeAdapter extends Adapter {
  getSendMessage() {
    return chrome.runtime.sendMessage
  }
}

new ChromeAdapter()

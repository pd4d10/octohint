import Adapter from './base'

export default class ChromeAdapter extends Adapter {
  getSendMessage() {
    return chrome.runtime.sendMessage
  }
}

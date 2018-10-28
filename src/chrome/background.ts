import Adapter from '../background/adapter'

class ChromeAdapter extends Adapter {
  addListener(cb: any) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!sender.tab || !sender.tab.id) return

      // TODO: Do not set it every time
      // chrome.browserAction.setIcon({ tabId: sender.tab.id, path: 'icons/active.png' })
      // chrome.browserAction.setTitle({ title: 'Octohint works' })
      cb(message, sendResponse)
    })
  }

  addTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status !== 'complete') return
      const code = 'var injected = window.octohintInjected; window.octohintInjected = true; injected;'
      chrome.tabs.executeScript(tabId, { code }, res => {
        if (chrome.runtime.lastError || res[0]) return
        chrome.tabs.executeScript(tabId, { file: 'dist/content-script.js' })
      })
    })
  }
}

new ChromeAdapter()

// Need to request all sites permissions to get URL
// So it does work as expected

// chrome.browserAction.onClicked.addListener(tab => {
//   if (!tab.url) return
//   const { protocol, host } = new URL(tab.url)
//   const origins = [protocol + '//' + host + '/*']
//   console.log(origins)
//   chrome.permissions.request({ origins }, granted => {
//     console.log(granted)
//     if (!granted) return
//   })
// })

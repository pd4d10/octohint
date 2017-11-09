/// <reference types="chrome" />
import BaseAdapter from './base'

export default class SafariAdapter extends BaseAdapter {
  addListener(cb) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      cb(message, sendResponse)
    })
  }

  addTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status !== 'complete') return
      const code = 'var injected = window.octohintInjected; window.octohintInjected = true; injected;'
      chrome.tabs.executeScript(tabId, { code }, res => {
        if (chrome.runtime.lastError || res[0]) return
        chrome.tabs.executeScript(tabId, { file: 'dist/sentry.js' }, () => {
          chrome.tabs.executeScript(tabId, { file: 'dist/content-script.js' })
        })
      })
    })
  }
}

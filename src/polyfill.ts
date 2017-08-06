/**
 * Polyfill for message handler
 * Because message listen and emit of Chrome and Safari are slightly different
 */

const isChrome = window.chrome && window.chrome.runtime

export function handleMessage(cb) {
  if (isChrome) {
    chrome.runtime.onMessage.addListener(cb)
    return
  }

  safari.application.addEventListener('message', res => {
    cb(res.message, undefined, message => {
      res.target.page.dispatchMessage('test', message)
    })
  }, false)
}

export function sendMessage(data, cb) {
  if (isChrome) {
    chrome.runtime.sendMessage(data, cb)
    return
  }

  window.OCTOHINT_ON_MESSAGE = cb
  safari.self.tab.dispatchMessage('from page', data)
}

// For Safari
if (!isChrome) {
  safari.self.addEventListener('message', window.OCTOHINT_ON_MESSAGE, false)
}

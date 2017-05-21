const isChrome = window.chrome && window.chrome.runtime

export function handleMessage(cb) {
  if (isChrome) {
    chrome.runtime.onMessage.addListener(cb)
    return
  }

  safari.application.addEventListener('message', res => {
    console.log(res)
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

  window.INTELLI_OCTO_ON_MESSAGE = cb
  safari.self.tab.dispatchMessage('from page', data)
}

// For Safari
if (!isChrome) {
  safari.self.addEventListener('message', window.INTELLI_OCTO_ON_MESSAGE, false)
}

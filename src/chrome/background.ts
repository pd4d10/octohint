async function inject(tabId: number) {
  console.log('injecting...')
  const { ChromeAdapter } = await import('./adapter')
  new ChromeAdapter()

  chrome.tabs.executeScript(tabId, { file: 'dist/content-script.js' }, () => {
    console.log('injected')
  })
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log('tabs.onUpdate', tabId, changeInfo, tab)

  if (changeInfo.status === 'complete') {
    chrome.tabs.executeScript(
      tabId,
      {
        code: 'var injected = window.octohintInjected; window.octohintInjected = true; injected;',
      },
      res => {
        if (!chrome.runtime.lastError && !res[0]) {
          inject(tabId)
        }
      },
    )
  }
})

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

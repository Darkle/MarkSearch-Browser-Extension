
import { isWebUri } from 'valid-url'

function getCurrentTabUrl(tabId){
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, tab => {
      !isWebUri(tab.url) ? reject(new Error('getCurrentTabUrl invalid url')) : resolve(tab.url)
    })
  })
}

export { getCurrentTabUrl }


import { isWebUri } from 'valid-url'

function insertContentScript(scriptName){
  chrome.tabs.executeScript(
    null,
    {
      file: scriptName,
      runAt: 'document_end'
    }
  )
}

function getCurrentTabId(){
  return new Promise( resolve => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      tabs => {
        resolve(tabs[0].id)
      }
    )
  })
}

function getCurrentTabUrl(tabId){
  return new Promise( resolve => {
    chrome.tabs.get(tabId, tab => {
      resolve(tab.url)
    })
  })
}

function checkIfValidUrl(url){
  return new Promise((resolve, reject) => {
    !isWebUri(url) ? reject(new Error('getCurrentTabUrl invalid url')) : resolve(url)
  })
}

export { getCurrentTabId, getCurrentTabUrl, checkIfValidUrl, insertContentScript }

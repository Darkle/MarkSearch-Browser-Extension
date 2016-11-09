require('file?name=manifest.[ext]!../manifest.json')

import { isBookmarkable } from './utils'

const extensionOptionsDefaultValues = {
  integrateWithBaiduSearch: true,
  integrateWithDuckduckgoSearch: true,
  integrateWithBingSearch: true,
  integrateWithGoogleSearch: true,
  extensionToken: ''
}
let marksearchServerAddress = null
let marksearchApiToken = null

function assignServerAddressAndToken(extensionTokenString){
  if(typeof extensionTokenString === 'string' && extensionTokenString.indexOf(',') > 1){
    const splitExtensionToken = extensionTokenString.split(',')
    marksearchServerAddress = splitExtensionToken[0]
    marksearchApiToken = splitExtensionToken[1]
  }
}

/*****
* This assigns the marksearchApiToken & marksearchServerAddress values on chrome startup.
*
* Using chrome.storage.local rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on)
*/
chrome.storage.local.get(null, ({extensionToken}) => assignServerAddressAndToken) // eslint-disable-line no-unused-vars

function updateIcon(pageIsSavedInMarkSearch, tabId){
  let title = 'Page Not Yet Saved To MarkSearch'
  let text = ''
  if(pageIsSavedInMarkSearch){
    title = 'Page Saved To MarkSearch'
    text = 'Saved'
  }
  chrome.browserAction.setTitle({title, tabId})
  chrome.browserAction.setBadgeText({text, tabId})
}

/*****
* Check if the web page is saved in MarkSearch
*/
function checkIfPageIsSaved(tabId){
  if(!marksearchServerAddress || !marksearchApiToken){
    return
  }

  chrome.tabs.get(tabId, tab => {
    if(!tab.url || !isBookmarkable(tab.url)){
      return
    }

    const fetchUrl = `${ marksearchServerAddress }/api/get/${ encodeURIComponent(tab.url) }`
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': marksearchApiToken
      })
    })

    fetch(request)
      .then( ({ status }) => {
        if(status === 200){
          updateIcon(true, tabId)
        }
        if(status === 404){
          updateIcon(false, tabId)
        }
      }).catch( err => {
        console.log('checkIfPageIsSaved fetch error')
        console.error(err)
      })
  })
}

/*****
* Event listeners
*/

chrome.runtime.onInstalled.addListener(({reason}) => {
  if(reason === 'install'){
    chrome.storage.local.get(null, options => {
      if(!options.extensionToken){
        /*****
        * Set up the default settings on first install.
        */
        chrome.storage.local.set(
          extensionOptionsDefaultValues,
          () => {
            chrome.runtime.openOptionsPage()
          }
        )
      }
    })
  }
})

chrome.tabs.onActivated.addListener(({tabId}) => {
  checkIfPageIsSaved(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
  if(tab.highlighted && status === 'complete') {
    checkIfPageIsSaved(tabId)
  }
})

chrome.windows.onFocusChanged.addListener(() => {
  chrome.windows.getCurrent({
    populate: true
  },
  window => {
    if(window && Array.isArray(window.tabs)) {
      for(const tab of window.tabs) {
        if(tab.highlighted) {
          console.log('onFocusChanged highlighted')
          checkIfPageIsSaved(tab.id)
        }
      }
    }
  })
})

/*****
* If user changes the token, update the reference for server address and server api token
*/
chrome.storage.onChanged.addListener(({extensionToken}, storageAreaName) => {
  if(storageAreaName === 'local' && extensionToken){
    assignServerAddressAndToken(extensionToken.newValue)
  }
})

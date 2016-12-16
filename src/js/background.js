import { browserActionEventHandler } from './browserActionHandler'
import { savePageMessageHandler } from './savePageMessageHandler'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, getSettings, syncServerAddressAndApiTokenInLocalStorage, checkIfDev } from './utils'
import { googleInstantSearchXHRrequestHandler } from './googleInstantSearchXHRrequestHandler'
import { googleInstantSearchXHRurlPatterns } from './googleInstantSearchXHRurlPatterns'
import { contextMenuOnClickedHandler } from './contextMenuOnClickedHandler'
import { onInstalledEventHandler } from './onInstalledEventHandler'
import { hotReloadInit } from './hotReload'
import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues'
import { searchMarkSearch } from './searchMarkSearch'
import { checkIfPageIsSavedAndUpdateIcon } from './checkIfPageIsSavedAndUpdateIcon'

/*****
* Note: using chrome.storage.local in the extension rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on)
*/

let googleContentScriptPort = null
// let duckDuckGoContentScriptPort = null

/*****
* Using localStorage to store the MarkSearch server address and token as we use them a lot in the
* background (the content script doesn't need access to these). We update these below in the
* chrome.storage.onChanged if the user changes the options.
*
* We don't use localStorage exclusively for settings as content scripts dont have access to the
* background scripts localStorage. The content scripts can access the chrome.storage API though.
*
* Note: syncServerAddressAndApiTokenInLocalStorage runs a tiny bit after chrome.runtime.onInstalled
* fires, but it shouldn't be an issue as onInstalledEventHandler also has to get settings.
*/
getSettings().then(({extensionToken}) => {
  syncServerAddressAndApiTokenInLocalStorage(extensionToken)
})

checkIfDev().then(isDevelopment => {
  if(isDevelopment){
    const devExtensionOptions = require('../../config/devExtOptions').devExtOptions
    /*****
    * Put the dev extension options on to the extensionOptionsDefaultValues. This is for when we
    * uninstall, then reinstall when in dev.
    */
    Object.assign(extensionOptionsDefaultValues, devExtensionOptions)

    syncServerAddressAndApiTokenInLocalStorage(devExtensionOptions.extensionToken)
    /*****
    * Hot reload for dev (http://bit.ly/2fXpr1G)
    */
    hotReloadInit()
  }
})

chrome.contextMenus.create(
  {
    id: 'marksearchOpenSearchPage',
    title: 'Open MarkSearch Search Page',
    contexts: ['browser_action']
  }
)

/*****
* Event listeners
*/
chrome.runtime.onInstalled.addListener(onInstalledEventHandler)

chrome.tabs.onActivated.addListener(({tabId}) => {
  checkIfPageIsSavedAndUpdateIcon(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
  if(tab.highlighted && status === 'complete') {
    checkIfPageIsSavedAndUpdateIcon(tabId)
  }
})

chrome.windows.onFocusChanged.addListener(() => {
  getCurrentTabId().then(checkIfPageIsSavedAndUpdateIcon).catch(errorLogger)
})
/*****
* If user changes the token, update the localStorage reference for server address and server api token
*/
chrome.storage.onChanged.addListener(({extensionToken}, storageAreaName) => {
  if(storageAreaName === 'local' && extensionToken){
    syncServerAddressAndApiTokenInLocalStorage(extensionToken.newValue)
  }
})

chrome.browserAction.onClicked.addListener(browserActionEventHandler)
/*****
* We use chrome.runtime.onMessage for the save page messages from sendPageData_ContentScript.
*/
chrome.runtime.onMessage.addListener(savePageMessageHandler)
/*****
* chrome.runtime.onConnect is for the search requests from content script and notifying
* of an instant xmlhttprequest search as there may be many of both of those if it's an instant
* search.
* Also for requesting a new port reference back here in background. The port reference
* is used in the chrome.webRequest.onBeforeRequest listeners to send messages back to the content
* script with the search terms and to be notified that an xhr instant search happened.
*/
chrome.runtime.onConnect.addListener(port => {
  if(port.name === 'requestNewPortReference'){
    if(googleContentScriptPort){
      googleContentScriptPort.disconnect()
    }
    googleContentScriptPort = port
  }
  if(port.name === 'googleContentScriptRequestMSsearch'){
    port.onMessage.addListener( ({searchTerms, dateFilter}) => {
      searchMarkSearch(searchTerms, dateFilter)
        .then(searchResults => {
          port.postMessage({searchResults, requestId: 0})
        })
        .catch(errorLogger)
    })
  }
  // if(port.name === 'duckDuckGoInstantSearch'){
  //   duckDuckGoContentScriptPort = port
  // }
})

chrome.webRequest.onBeforeRequest.addListener(
  webRequestDetails => {
    googleInstantSearchXHRrequestHandler(webRequestDetails)
  },
  {
    urls: googleInstantSearchXHRurlPatterns,
    types: ['main_frame', 'xmlhttprequest']
  }
)

// chrome.webRequest.onBeforeRequest.addListener(
//   ({tabId: requestTabId, method, type, url}) => {
//     duckDuckGoSearchRequestHandler(duckDuckGoContentScriptPort, requestTabId, method, type, url)
//   },
//   {
//     urls: duckDuckGoUrlPatterns,
//     types: ['main_frame', 'xmlhttprequest']
//   }
// )

chrome.contextMenus.onClicked.addListener(contextMenuOnClickedHandler)

export {
  googleContentScriptPort
}

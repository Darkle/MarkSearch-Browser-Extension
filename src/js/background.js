
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { browserActionEventHandler } from './browserActionHandler'
import { background_ContentScriptMessageHandler } from './background_ContentScriptMessageHandler'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, getSettings, syncServerAddressAndApiTokenInLocalStorage, checkIfDev } from './utils'
import { googleSearchRequestHandler } from './googleSearchRequestHandler'
import { googleUrlPatterns } from './googleUrls'
import { contextMenuOnClickedHandler } from './contextMenuOnClickedHandler'
import { onInstalledEventHandler } from './onInstalledEventHandler'
import { hotReloadInit } from './hotReload'
import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues'

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
*/
async function initBackgroundPage() {
  const isDevelopment = await checkIfDev()
  const extensionSettings = await getSettings()
  let extensionTokenToSync = extensionSettings.extensionToken

  if(isDevelopment){
    const devExtensionOptions = require('../../config/devExtOptions').devExtOptions
    extensionTokenToSync = devExtensionOptions.extensionToken
    /*****
    * Put the dev extension options on to the extensionOptionsDefaultValues. This is for when we
    * uninstall, then reinstall when in dev.
    */
    console.log('extensionTokenToSync', extensionTokenToSync)
    console.log('devExtensionOptions', devExtensionOptions)
    Object.assign(extensionOptionsDefaultValues, devExtensionOptions)
    console.log('extensionOptionsDefaultValues', extensionOptionsDefaultValues)
    /*****
    * Hot reload for dev (http://bit.ly/2fXpr1G)
    */
    hotReloadInit()
  }

  syncServerAddressAndApiTokenInLocalStorage(extensionTokenToSync)
}

initBackgroundPage()

function checkIfPageIsSavedAndUpdateIcon(tabId){
  checkIfPageIsSaved(tabId)
    .then( pageIsSavedInMarkSearch => updateIcon(pageIsSavedInMarkSearch, tabId))
    .catch(errorLogger)
}

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
* We use chrome.runtime.onMessage for the one off messages like saving the current
* page to MarkSearch, or doing a MarkSearch search on page load for the search
* engine content script.
*/
chrome.runtime.onMessage.addListener(background_ContentScriptMessageHandler)

/*****
* chrome.runtime.onConnect is for the instant search as there may be many of those per page
* load.
*/
chrome.runtime.onConnect.addListener(port => {
  if(port.name === 'googleInstantSearch'){
    googleContentScriptPort = port
  }
  // if(port.name === 'duckDuckGoInstantSearch'){
  //   duckDuckGoContentScriptPort = port
  // }
})

chrome.webRequest.onBeforeRequest.addListener(
  webRequestDetails => {
    googleSearchRequestHandler(googleContentScriptPort, webRequestDetails)
  },
  {
    urls: googleUrlPatterns,
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

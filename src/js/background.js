
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { browserActionEventHandler } from './browserActionHandler'
import { backgroundOnMessageHandler } from './backgroundOnMessageHandler'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, getSettings, syncServerAddressAndApiTokenInLocalStorage } from './utils'
import { handleSearchRequest } from './handleSearchRequest'
import { contextMenuOnClickedHandler } from './contextMenuOnClickedHandler'
import { onInstalledEventHandler } from './onInstalledEventHandler'
import { hotReloadInit } from './hotReload'
import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues'

/*****
* Note: using chrome.storage.local in the extension rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on)
*/

/*****
* Hot reload (http://bit.ly/2fXpr1G)
*/
chrome.management.getSelf( ({installType}) => {
  if(installType === 'development'){
    hotReloadInit()
  }
})

function checkIfPageIsSavedAndUpdateIcon(tabId){
  checkIfPageIsSaved(tabId)
    .then( pageIsSavedInMarkSearch => updateIcon(pageIsSavedInMarkSearch, tabId))
    .catch(errorLogger)
}

/*****
* Using localStorage to store the MarkSearch server address and token as we use them a lot in the
* background (the content script doesn't need access to these). We update these below in the
* chrome.storage.onChanged if the user changes the options.
*/
getSettings().then(({extensionToken}) => syncServerAddressAndApiTokenInLocalStorage(extensionToken))
// TODO - remove 3 lines below and uncomment out one above when production ready
// TODO - also remove the import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues' above
// if not needed in this script
// const tempExtensionToken = 'http://192.168.1.2:8080,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJNYXJrU2VhcmNoIEV4dGVuc2lvbi9Cb29rbWFya2xldF80NiIsImlhdCI6MTQ3OTMzOTY2OX0.OjiFQoFRw4LrqrVlSNzv87dlN9A0wYQZnQf5dehPFKU'
// syncServerAddressAndApiTokenInLocalStorage(tempExtensionToken)
// extensionOptionsDefaultValues.extensionToken = tempExtensionToken

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
chrome.runtime.onMessage.addListener(backgroundOnMessageHandler)

chrome.runtime.onConnect.addListener(port => {
  if(port.name === 'openOptionsPage'){
    port.onMessage.addListener(() => chrome.runtime.openOptionsPage())
  }
  if(port.name === 'contentScriptSearchRequest'){
    handleSearchRequest(port)
  }
})

chrome.contextMenus.onClicked.addListener(contextMenuOnClickedHandler)

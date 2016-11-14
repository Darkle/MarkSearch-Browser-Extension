
import { assignServerAddressAndToken } from './serverAddressAndToken'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { browserActionEventHandler } from './browserActionHandler'
import { backgroundOnMessageHandler } from './backgroundOnMessageHandler'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, getSettings } from './utils'
import { handleSearchRequest } from './handleSearchRequest'

/*****
* Note: using chrome.storage.local rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on)
*/

const extensionOptionsDefaultValues = {
  integrateWithBaiduSearch: true,
  integrateWithDuckduckgoSearch: true,
  integrateWithBingSearch: true,
  integrateWithGoogleSearch: true,
  extensionToken: ''
}

function checkIfPageIsSavedAndUpdateIcon(tabId){
  checkIfPageIsSaved(tabId)
    .then( pageIsSavedInMarkSearch => updateIcon(pageIsSavedInMarkSearch, tabId))
    .catch(errorLogger)
}

/*****
* This assigns the marksearchApiToken & marksearchServerAddress values on chrome startup.
*/
// getSettings().then(({extensionToken}) => assignServerAddressAndToken(extensionToken))
// TODO - remove 3 lines below and uncomment out one above when production ready
const tempExtensionToken = 'http://192.168.1.2:8080,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJNYXJrU2VhcmNoIEV4dGVuc2lvbi9Cb29rbWFya2xldF80MyIsImlhdCI6MTQ3OTA3NTAzNn0.fUMvkSI4eH0fdcbigcb169YJTGr97XRVcqGMDgE8QAY'
assignServerAddressAndToken(tempExtensionToken)
extensionOptionsDefaultValues.extensionToken = tempExtensionToken

/*****
* Event listeners
*/
chrome.runtime.onInstalled.addListener(({reason}) => {
  if(reason === 'install'){
    getSettings()
      .then(({extensionToken}) => {
        if(!extensionToken){
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
* If user changes the token, update the reference for server address and server api token
*/
chrome.storage.onChanged.addListener(({extensionToken}, storageAreaName) => {
  if(storageAreaName === 'local' && extensionToken){
    assignServerAddressAndToken(extensionToken.newValue)
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

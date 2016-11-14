
import { assignServerAddressAndToken } from './serverAddressAndToken'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { browserActionEventHandler } from './browserActionHandler'
import { backgroundMessageHandler } from './backgroundMessageHandler'
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
getSettings().then(({extensionToken}) => assignServerAddressAndToken(extensionToken))

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
chrome.runtime.onMessage.addListener(backgroundMessageHandler)
chrome.runtime.onConnect.addListener(handleSearchRequest)

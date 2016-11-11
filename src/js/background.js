require('file?name=manifest.[ext]!../manifest.json')

import { assignServerAddressAndToken } from './serverAddressAndToken'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { savePageToMarkSearch } from './savePageToMarkSearch'
import { removePageFromMarkSearch } from './removePageFromMarkSearch'
import { errorHandler } from './errorHandler'

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
    .catch(errorHandler)
}

/*****
* This assigns the marksearchApiToken & marksearchServerAddress values on chrome startup.
*/
chrome.storage.local.get(null, ({extensionToken}) => {
  assignServerAddressAndToken(extensionToken)
})

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
  checkIfPageIsSavedAndUpdateIcon(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
  if(tab.highlighted && status === 'complete') {
    checkIfPageIsSavedAndUpdateIcon(tabId)
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
          checkIfPageIsSavedAndUpdateIcon(tab.id)
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

chrome.browserAction.onClicked.addListener( tab => {
  checkIfPageIsSaved(tab.id)
    .then( pageIsSavedInMarkSearch => {
      /*****
      * If they have clicked on the button and the page is already saved, remove it.
      */
      if(pageIsSavedInMarkSearch){
        return removePageFromMarkSearch(tab.url)
          .then(() => updateIcon(false, tab.id))
      }
      /*****
      * If it's not saved, run the content script to save it.
      */
      chrome.tabs.executeScript(
        null,
        {
          file: 'savePageAndNotify_ContentScript.build.js',
          runAt: 'document_end'
        }
      )
    })
    .catch(error => {
      errorHandler(error)
      /*****
      * If we get here then checkIfPageIsSaved or removePageFromMarkSearch didn't work. We should
      * notify the user, so send a message to savePageAndNotify_ContentScript so it can inform the user.
      */
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        tabs => {
          chrome.tabs.sendMessage(tabs[0].id, {pageSaved: false})
        }
      )
    })
})

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
  if(!request.url){
    sendResponse({pageSaved: false})
    return
  }
  savePageToMarkSearch(request)
    .then(() => {
      sendResponse({pageSaved: true})
    })
    .catch(error => {
      errorHandler(error)
      sendResponse({pageSaved: false})
    })
  /*****
  * Gotta return true here to make sendResponse be called asynchronously - http://bit.ly/2eOulQT
  * ¯\_(ツ)_/¯
  */
  return true
})

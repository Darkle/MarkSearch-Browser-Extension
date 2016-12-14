
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { browserActionEventHandler } from './browserActionHandler'
import { backgroundOnMessageHandler } from './backgroundOnMessageHandler'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, getSettings, syncServerAddressAndApiTokenInLocalStorage, checkIfDev } from './utils'
import { handleSearchRequest } from './handleSearchRequest'
import { contextMenuOnClickedHandler } from './contextMenuOnClickedHandler'
import { onInstalledEventHandler } from './onInstalledEventHandler'
import { googleWebRequestHandler } from './googleWebRequestHandler'
import { hotReloadInit } from './hotReload'
import { extensionOptionsDefaultValues } from './extensionOptionsDefaultValues'
import { googleUrlPatterns } from './googleUrls'

/*****
* Note: using chrome.storage.local in the extension rather than storage.sync in case they have MarkSearch
* set up on a different network and have different settings there (e.g. different
* port number that MarkSearch is running on)
*/

/*****
* Using localStorage to store the MarkSearch server address and token as we use them a lot in the
* background (the content script doesn't need access to these). We update these below in the
* chrome.storage.onChanged if the user changes the options.
*
* We don't use localStorage exclusively for settings as content scripts dont have access to the
* background scripts localStorage. The content scripts can access the chrome.storage API though.
*/
(async () => {
  const isDevelopment = await checkIfDev()
  const extensionSettings = await getSettings()
  let extensionTokenToSync = extensionSettings.extensionToken

  if(isDevelopment){
    /*****
    * Hot reload for dev (http://bit.ly/2fXpr1G)
    */
    hotReloadInit()

    const devExtensionOptions = require('../../config/devExtOptions')
    extensionTokenToSync = devExtensionOptions.extensionToken
    /*****
    * Put the dev extension options on to the extensionOptionsDefaultValues. This is for if/when we
    * uninstall, then reinstall when in dev.
    */
    Object.assign(extensionOptionsDefaultValues, devExtensionOptions)
  }

  syncServerAddressAndApiTokenInLocalStorage(extensionTokenToSync)

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
  chrome.runtime.onMessage.addListener(backgroundOnMessageHandler)

  chrome.runtime.onConnect.addListener(port => {
    // if(port.name === 'openOptionsPage'){
    //   port.onMessage.addListener(() => chrome.runtime.openOptionsPage())
    // }
    if(port.name === 'contentScriptSearchRequest'){
      handleSearchRequest(port)
    }
  })

  chrome.contextMenus.onClicked.addListener(contextMenuOnClickedHandler)

  chrome.webRequest.onBeforeRequest.addListener(
    googleWebRequestHandler,
    {
      urls: googleUrlPatterns,
      types: ['main_frame', 'xmlhttprequest']
    }
  )
})()

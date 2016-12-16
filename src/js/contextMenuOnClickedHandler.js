
import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { insertContentScript, safeGetObjectProperty } from './utils'

function contextMenuOnClickedHandler({menuItemId}){
  if(menuItemId === 'marksearchOpenSearchPage'){
    if(localStorage.marksearchServerAddress){
      chrome.tabs.create({url: localStorage.marksearchServerAddress})
      return
    }
    /*****
    * If the user tries to open the MarkSearch server before they have set up the
    * extension settings, notify the user to set it up.
    */
    sendMessageToNotifyContentScript({notifyScriptRunningCheck: true})
      .then( response => {
        if(!safeGetObjectProperty(response, 'scriptAlreadyInserted')){
          return insertContentScript('showNotification_ContentScript.build.js')
        }
      })
      .then(() => {
        sendMessageToNotifyContentScript(
          {
            actionSucceeded: false,
            errorMessage: 'You Have Not Set The Token In The MarkSearch Chrome Extension Settings.'
          }
        )
      })
  }
}

export { contextMenuOnClickedHandler }

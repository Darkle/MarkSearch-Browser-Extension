
import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { insertContentScript, safeGetObjectProperty } from './utils'

function contextMenuOnClickedHandler({menuItemId}){
  if(menuItemId === 'marksearchOpenSearchPage'){
    if(localStorage.marksearchServerAddress){
      chrome.tabs.create({url: localStorage.marksearchServerAddress})
      return
    }
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
            errorMessage: 'You Have Not Set The MarkSearch Token In The Chrome Extension Settings.'
          }
        )
      })
  }
}

export { contextMenuOnClickedHandler }

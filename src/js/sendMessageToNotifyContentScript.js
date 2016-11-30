
import { getCurrentTabId } from './utils'

/*****
* sendMessageToNotifyContentScript sends a message to savePageAndNotify_ContentScript so it can inform the user
* as to the success/failure of saving the page to MarkSearch.
*/
function sendMessageToNotifyContentScript({action, actionSucceeded, errorMessage, noToken, notifyScriptRunningCheck}){
  return new Promise( resolve => {
    getCurrentTabId()
      .then(tabId => {
        chrome.tabs.sendMessage(
          tabId,
          {
            action,
            actionSucceeded,
            errorMessage,
            noToken,
            notifyScriptRunningCheck
          },
          resolve
        )
      })
  })
}

export { sendMessageToNotifyContentScript }

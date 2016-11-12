
/*****
* sendMessageToNotifyContentScript sends a message to savePageAndNotify_ContentScript so it can inform the user
* as to the success/failure of saving the page to MarkSearch.
*/
function sendMessageToNotifyContentScript({action, actionSucceeded, errorMessage, noToken, notifyScriptRunningCheck}){
  return new Promise( resolve => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      tabs => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action,
            actionSucceeded,
            errorMessage,
            noToken,
            notifyScriptRunningCheck
          },
          /*****
          * resolve here is for browserActionEventHandler when it wants to check if the showNotification_ContentScript
          * is already inserted.
          */
          resolve
        )
      }
    )
  })
}

export { sendMessageToNotifyContentScript }

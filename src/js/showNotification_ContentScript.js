
import '../styles/notie.styl'
import '../styles/showNotification_ContentScript.styl'

import { alert as notieAlert, setOptions as notieSetOptions } from 'notie'

function showNotification(action, actionSucceeded, errorMessage){
  let notificationMessage = action === 'savePage' ? 'Page Saved To MarkSearch' : 'Page Removed From MarkSearch'
  let notificationType = 1  //1 is notie Success
  if(!actionSucceeded){
    notificationType = 3  //3 is notie Error
    notificationMessage = errorMessage
  }
  notieAlert(notificationType, notificationMessage, 4)
}

notieSetOptions({
  colorSuccess: '#3498DB',
  colorError: '#F1C40F',
  colorText: '#FFFFFF',
  backgroundClickDismiss: false
})

chrome.runtime.onMessage.addListener(
  (
    {
      action,
      actionSucceeded,
      errorMessage,
      noToken,
      notifyScriptRunningCheck
    },
    sender,
    sendResponse
  ) => {
    /*****
    * notifyScriptRunningCheck is for the browserActionHandler to check if this script is already inserted into the page
    * as as it has a message listener & multiple showNotification_ContentScript scripts will mean multiple listeners
    * and multiple notifications.
    */
    if(notifyScriptRunningCheck){
      sendResponse({scriptAlreadyInserted: true})
      return
    }
    if(typeof actionSucceeded !== 'undefined'){
      showNotification(action, actionSucceeded, errorMessage, noToken)
    }
  }
)

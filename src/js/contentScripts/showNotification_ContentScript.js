
import '../../styles/notie.styl'
import '../../styles/showNotification_ContentScript.styl'

import { alert as notieAlert, setOptions as notieSetOptions } from 'notie'

function showNotification(action, actionSucceeded, errorMessage){
  const notificationMessage = action === 'savePage' ? 'Page Saved To MarkSearch' : 'Page Removed From MarkSearch'
  if(!actionSucceeded){
    /*****
    * If it's an error message, leave it showing. They can click to close it.
    */
    notieAlert(3, errorMessage)   //3 is notie Error
  }
  else{
    notieAlert(1, notificationMessage, 4) //1 is notie Success, 4 for 4 seconds
  }
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

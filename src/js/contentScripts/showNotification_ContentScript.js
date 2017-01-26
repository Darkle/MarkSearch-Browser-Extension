import '../../inlineStyles/notie.styl'
import '../../inlineStyles/showNotification_ContentScript.styl'

import { alert as notieAlert, setOptions as notieSetOptions } from 'notie'

/*****
* We need to create a stylsheet manually here because we can't inline the font for the notification because
* it runs on all pages and some pages (e.g. github) restrict the use of inlining stuff with their CSP.
* We need to do this here dynamically because we need to use the chrome.extension.getURL api to get the
* internal url of the font file. (we also added the font file path to the web_accessible_resources in
* the manifest)
* Note: some more details in comments in webpack config
*/
function insertStylsheet(){
  const styleEl = document.createElement('style')
  styleEl.setAttribute('id', 'markSearchStyleSheet')
  styleEl.textContent = `
    @font-face {
    	font-family: 'opensans_regular';
    	src: url("${ chrome.extension.getURL('fonts/opensans-regular.woff2') }") format('woff2');
    	font-weight: normal;
    	font-style: normal;
    }
  `
  document.head.appendChild(styleEl)
}

function showNotification(action, actionSucceeded, errorMessage){
  if(!document.querySelector('#markSearchStyleSheet')){
    insertStylsheet()
  }
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
    /*****
    * actionSucceeded can be false, so need to check if undefined to check if it's there.
    */
    if(typeof actionSucceeded !== 'undefined'){
      showNotification(action, actionSucceeded, errorMessage)
    }
  }
)

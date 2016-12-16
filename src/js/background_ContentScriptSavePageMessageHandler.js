import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { savePageToMarkSearch } from './savePageToMarkSearch'
import { updateIcon } from './updateIcon'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, createErrorMessageToShowUser, safeGetObjectProperty } from './utils'

/*****
* background_ContentScriptSavePageMessageHandler is run when the sendPageData_ContentScript sends a message
* with the pageData back to the background script to be saved to MarkSearch.
*/
async function background_ContentScriptSavePageMessageHandler(messageData){
  /*****
  * If there's a .url property then we know a content script wants to save a page
  * to MarkSearch.
  */
  if(safeGetObjectProperty(messageData, 'url')){
    try{
      await savePageToMarkSearch(messageData)
      await sendMessageToNotifyContentScript({action: 'savePage', actionSucceeded: true})
      const pageIsSavedInMarkSearch = true
      updateIcon(pageIsSavedInMarkSearch, await getCurrentTabId())
    }
    catch(error){
      errorLogger(error)
      sendMessageToNotifyContentScript(
        {
          action: 'savePage',
          actionSucceeded: false,
          errorMessage: createErrorMessageToShowUser(error, 'savePage')
        }
      )
    }
  }
}

export { background_ContentScriptSavePageMessageHandler }

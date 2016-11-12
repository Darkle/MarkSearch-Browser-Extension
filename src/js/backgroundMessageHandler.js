import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { savePageToMarkSearch } from './savePageToMarkSearch'
import { updateIcon } from './updateIcon'
import { errorLogger } from './errorLogger'
import { getCurrentTabId } from './utils'

/*****
* This is run when the sendPageData_ContentScript sends a message with the pageData back to the
* background script.
*/
function backgroundMessageHandler(request){
  savePageToMarkSearch(request)
    .then(() => {
      /*****
      * Dont need to wait for sendMessageToNotifyContentScript to resolve
      */
      sendMessageToNotifyContentScript(
        {
          action: 'savePage',
          actionSucceeded: true,
        }
      )
    })
    .then(getCurrentTabId)
    .then(tabId => {
      const pageIsSavedInMarkSearch = true
      updateIcon(pageIsSavedInMarkSearch, tabId)
    })
    .catch(error => {
      errorLogger(error)
      const errorMessage = `There was an error saving the page to MarkSearch.
                            ${ (error && error.message) ? error.message : '' }`
      sendMessageToNotifyContentScript(
        {
          action: 'savePage',
          actionSucceeded: false,
          errorMessage
        }
      )
    })
}

export { backgroundMessageHandler }

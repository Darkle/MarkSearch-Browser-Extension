import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { savePageToMarkSearch } from './savePageToMarkSearch'
import { updateIcon } from './updateIcon'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, createErrorMessageToShowUser } from './utils'

/*****
* This is run when the sendPageData_ContentScript sends a message with the pageData back to the
* background script.
*/
function backgroundMessageHandler(request){
  savePageToMarkSearch(request)
    .then(() =>
      sendMessageToNotifyContentScript(
        {
          action: 'savePage',
          actionSucceeded: true,
        }
      )
    )
    .then(getCurrentTabId)
    .then(tabId => {
      const pageIsSavedInMarkSearch = true
      updateIcon(pageIsSavedInMarkSearch, tabId)
    })
    .catch(error => {
      errorLogger(error)

      sendMessageToNotifyContentScript(
        {
          action: 'savePage',
          actionSucceeded: false,
          errorMessage: createErrorMessageToShowUser(error, 'saving')
        }
      )
    })
}

export { backgroundMessageHandler }

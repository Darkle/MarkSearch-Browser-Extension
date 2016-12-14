import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { savePageToMarkSearch } from './savePageToMarkSearch'
import { updateIcon } from './updateIcon'
import { errorLogger } from './errorLogger'
import { getCurrentTabId, createErrorMessageToShowUser } from './utils'
import { searchMarkSearch } from './searchMarkSearch'

/*****
* background_ContentScriptMessageHandler is run when the sendPageData_ContentScript sends a message
* with the pageData back to the background script to be saved to MarkSearch or on load
* of <searchEngine>Search_ContentScript when it sends a message requesting for search results
* from the MarkSearch server - <searchEngine>Search_ContentScript sends this request once on the
* content script load.
*/
async function background_ContentScriptMessageHandler(messageData){
  const currentTabId = await getCurrentTabId()
  /*****
  * If there's a .url property then we know a content script wants to save a page
  * to MarkSearch.
  */
  if(messageData.url){
    savePageToMarkSearch(messageData)
      .then(() =>
        sendMessageToNotifyContentScript(
          {
            action: 'savePage',
            actionSucceeded: true,
          }
        )
      )
      .then(() => {
        const pageIsSavedInMarkSearch = true
        updateIcon(pageIsSavedInMarkSearch, currentTabId)
      })
      .catch(error => {
        errorLogger(error)
        sendMessageToNotifyContentScript(
          {
            action: 'savePage',
            actionSucceeded: false,
            errorMessage: createErrorMessageToShowUser(error, 'savePage')
          }
        )
      })
  }
  /*****
  * If there's a searchTerms property then we know a content script wants to search the
  * MarkSearch server.
  */
  else if(messageData.searchTerms){
    let searchResults = []
    try{
      searchResults = await searchMarkSearch(messageData.searchTerms, messageData.dateFilter)
    }
    catch(err){
      errorLogger(err)
    }
    chrome.tabs.sendMessage(currentTabId, searchResults)
  }
}

export { background_ContentScriptMessageHandler }
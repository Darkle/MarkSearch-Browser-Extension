
import { removePageFromMarkSearch } from './removePageFromMarkSearch'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'

function browserActionEventHandler(tab){
  /*****
  * Put showNotification_ContentScript script in straight away so we can notify user of success/failure.
  * Need to check first if it is already running on the page as it has a message listener & multiple
  * showNotification_ContentScript scripts will mean multiple listeners and multiple notifications.
  */
  let action = ''
  sendMessageToNotifyContentScript({notifyScriptRunningCheck: true})
    .then( response => {
      if(!response || !response.scriptAlreadyInserted){
        chrome.tabs.executeScript(
          null,
          {
            file: 'showNotification_ContentScript.build.js',
            runAt: 'document_end'
          }
        )
      }
    })
    .then(() => checkIfPageIsSaved(tab.id))
    .then( pageIsSavedInMarkSearch => {
      /*****
      * If they have clicked on the button and the page is already saved, remove it.
      */
      if(pageIsSavedInMarkSearch){
        action = 'removePage'
        return removePageFromMarkSearch(tab.url)
          .then(() => {
            /*****
            * now that removePageFromMarkSearch succeded it is not saved any more on the server,
            * so pageIsSavedInMarkSearch = false
            */
            pageIsSavedInMarkSearch = false // eslint-disable-line no-param-reassign
            updateIcon(pageIsSavedInMarkSearch, tab.id)
            return sendMessageToNotifyContentScript(
              {
                action,
                actionSucceeded: true
              }
            )
          })
      }
      /*****
      * If it's not saved, run the content script to save it.
      * Note: dont' have to worry about multiple sendPageData_ContentScript's being on the page as
      * it doesn't have any message/event listeners and just sends a single message straight away.
      */
      else{ // eslint-disable-line no-else-return
        action = 'savePage'
        chrome.tabs.executeScript(
          null,
          {
            file: 'sendPageData_ContentScript.build.js',
            runAt: 'document_end'
          }
        )
      }
    })
    .catch(error => {
      console.error(error)
      /*****
      * If we get here then checkIfPageIsSaved or removePageFromMarkSearch didn't work. We should
      * notify the user.
      * If checkIfPageIsSaved errors, then we wont know if we were going to save or remove the page, so
      * have a 'saving or removing' as the backup.
      */
      let actionAttempted = 'saving or removing'
      if(action === 'savePage'){
        actionAttempted = 'saving'
      }
      if(action === 'removePage'){
        actionAttempted = 'removing'
      }
      sendMessageToNotifyContentScript(
        {
          action,
          actionSucceeded: false,
          errorMessage: `There was an error ${ actionAttempted } this page from MarkSearch.`
        }
      )
    })
}

export { browserActionEventHandler }

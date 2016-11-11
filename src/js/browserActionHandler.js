
import { removePageFromMarkSearch } from './removePageFromMarkSearch'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { errorHandler } from './errorHandler'

function browserActionEventHandler(tab){
  checkIfPageIsSaved(tab.id)
    .then( pageIsSavedInMarkSearch => {
      /*****
      * If they have clicked on the button and the page is already saved, remove it.
      */
      if(pageIsSavedInMarkSearch){
        return removePageFromMarkSearch(tab.url)
          .then(() => updateIcon(false, tab.id))
      }
      /*****
      * If it's not saved, run the content script to save it.
      */
      chrome.tabs.executeScript(
        null,
        {
          file: 'savePageAndNotify_ContentScript.build.js',
          runAt: 'document_end'
        }
      )
    })
    .catch(error => {
      errorHandler(error)
      /*****
      * If we get here then checkIfPageIsSaved or removePageFromMarkSearch didn't work. We should
      * notify the user, so send a message to savePageAndNotify_ContentScript so it can inform the user.
      */
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        tabs => {
          chrome.tabs.sendMessage(tabs[0].id, {pageSaved: false})
        }
      )
    })
}

export { browserActionEventHandler }


import * as Promise from 'bluebird'

import { removePageFromMarkSearch } from './removePageFromMarkSearch'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { errorLogger } from './errorLogger'
import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'

function browserActionEventHandler(tab){
  /*****
  * Put showNotification_ContentScript script in straight away so we can notify user of success/failure.
  * Need to check first if it is already running on the page as it has a message listener & multiple
  * showNotification_ContentScript scripts will mean multiple listeners and multiple notifications.
  *
  * Using bluebird here so that can use .bind for 'action' and 'tab' so it doesn't get overwritten if another
  * browserActionEventHandler runs before this finishes. (need to use non-arrow functions where using this.
  * so the this context isnt messed up)
  */

  /* eslint-disable no-invalid-this */
  Promise.resolve()
    .bind({action: 'saving or removing', tab, noToken: false})
    .then(() => sendMessageToNotifyContentScript({notifyScriptRunningCheck: true}))
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
    .then(function() {
      /*****
      * If they havent yet saved the MarkSearch token to the extension settings page, then notify then and throw.
      * We need to wait untill the showNotification_ContentScript is inserted before we check the tokens are saved
      * as we will need that content script to inform the user that they haven't saved the them.
      */
      if(!marksearchServerAddress || !marksearchApiToken){
        /*****
        * Dont need to wait for sendMessageToNotifyContentScript to finish.
        */
        this.noToken = true
        sendMessageToNotifyContentScript({noTokens: true})
        throw new Error('token not saved in extension settings')
      }
      return checkIfPageIsSaved(this.tab.id)
    })
    .then(function() {
      return checkIfPageIsSaved(this.tab.id)
    })
    .then(function(pageIsSavedInMarkSearch){
      /*****
      * If they have clicked on the button and the page is already saved, remove it.
      */
      if(pageIsSavedInMarkSearch){
        /*****
        * removePageFromMarkSearch resolves true if it successfully removed the page
        */
        return removePageFromMarkSearch(this.tab.url)
      }
      /*****
      * If it's not saved, run the content script to save it.
      * Note: dont' have to worry about multiple sendPageData_ContentScript's being on the page as
      * it doesn't have any message/event listeners and just sends a single message straight away.
      */
      this.action = 'savePage'
      chrome.tabs.executeScript(
        null,
        {
          file: 'sendPageData_ContentScript.build.js',
          runAt: 'document_end'
        }
      )
      /*****
      * return false to indicate we didn't remove a page
      */
      return false
    })
    .then(function(successfullyRemovedPage){
      if(successfullyRemovedPage){
        this.action = 'removedPage'
        const pageIsSavedInMarkSearch = !successfullyRemovedPage
        updateIcon(pageIsSavedInMarkSearch, this.tab.id)
        return sendMessageToNotifyContentScript(
          {
            action: this.action,
            actionSucceeded: true
          }
        )
      }
    })
    .catch(function(error){
      /*****
      * If we get here then checkIfPageIsSaved or removePageFromMarkSearch didn't work. We should
      * notify the user.
      */
      errorLogger(error)
      /*****
      * If the error is that there is no token saved in the settings, then return early as we have already
      * sent a message via sendMessageToNotifyContentScript above.
      */
      if(this.noToken){
        return
      }
      const errorMessage = `There was an error ${ this.action } this page from MarkSearch.
                            ${ (error && error.message) ? error.message : '' }`
      sendMessageToNotifyContentScript(
        {
          action: this.action,
          actionSucceeded: false,
          errorMessage
        }
      )
    })
    /* eslint-enable no-invalid-this */
}

export { browserActionEventHandler }

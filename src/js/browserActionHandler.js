
import * as Promise from 'bluebird'

import { removePageFromMarkSearch } from './removePageFromMarkSearch'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { errorLogger } from './errorLogger'
import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'
import { insertContentScript, createErrorMessageToShowUser, safeGetObjectProperty } from './utils'

function browserActionEventHandler(tab){
  /*****
  * Put showNotification_ContentScript script in straight away so we can notify user of success/failure.
  * Need to check first if it is already running on the page as it has a message listener & multiple
  * showNotification_ContentScript scripts will mean multiple listeners and multiple notifications.
  *
  * Using bluebird here so that can use .bind for 'action',  'tab' et.al. so they don't get overwritten if another
  * browserActionEventHandler runs before this finishes. (need to use non-arrow functions where using this.
  * so the this context isnt messed up)
  */

  /* eslint-disable no-invalid-this */
  Promise
    .resolve()
    .bind({action: 'saving or removing', tab, noToken: false})
    .then(() => sendMessageToNotifyContentScript({notifyScriptRunningCheck: true}))
    .then( response => {
      if(!safeGetObjectProperty(response, 'scriptAlreadyInserted')){
        /*****
        * insertContentScript returns a promise, so return it so the script is ready.
        */
        return insertContentScript('showNotification_ContentScript.build.js')
      }
    })
    .then(function() {
      /*****
      * If they havent yet saved the MarkSearch token to the extension settings page, then throw.
      * We need to wait untill the showNotification_ContentScript is inserted before we check the tokens are saved
      * as we will need that content script to inform the user that they haven't saved the them.
      * We send the error info with sendMessageToNotifyContentScript in the catch at the end of the promise
      * chain below.
      */
      if(!marksearchServerAddress || !marksearchApiToken){
        this.noToken = true
        throw new Error('token not saved in extension settings')
      }
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
        this.action = 'removePage'
        return removePageFromMarkSearch(this.tab.url)
      }
      /*****
      * If it's not saved, run the content script to save it.
      * Note: dont' have to worry about multiple sendPageData_ContentScript's being on the page as
      * it doesn't have any message/event listeners and just sends a single message straight away.
      * Note: don't need to return and wait for insertContentScript('sendPageData_ContentScript.build.js')
      * to finish.
      */
      this.action = 'savePage'
      insertContentScript('sendPageData_ContentScript.build.js')
      /*****
      * return false to indicate we didn't remove a page
      */
      return false
    })
    .then(function(successfullyRemovedPage){
      if(successfullyRemovedPage){
        const pageIsSavedInMarkSearch = false
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
      * If we get here then checkIfPageIsSaved or removePageFromMarkSearch didn't work, or there was no
      * token saved in the settings. Log error and notify the user.
      */
      errorLogger(error)
      sendMessageToNotifyContentScript(
        {
          action: this.action,
          actionSucceeded: false,
          errorMessage: createErrorMessageToShowUser(error, this.action),
          noTokens: this.noToken
        }
      )
    })
    /* eslint-enable no-invalid-this */
}

export { browserActionEventHandler }

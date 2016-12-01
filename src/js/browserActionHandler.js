
import { removePageFromMarkSearch } from './removePageFromMarkSearch'
import { checkIfPageIsSaved } from './checkIfPageIsSaved'
import { updateIcon } from './updateIcon'
import { sendMessageToNotifyContentScript } from './sendMessageToNotifyContentScript'
import { errorLogger } from './errorLogger'
import { insertContentScript, createErrorMessageToShowUser, safeGetObjectProperty } from './utils'

async function browserActionEventHandler(tab){
  /*****
  * action is so we can display a decent error message to the user if something messes up.
  * Note: if we error at checkIfPageIsSaved() or before, we won't know if we were saving
  * or removing, so set the 'action' as 'saving or removing'.
  */
  let action = 'saving or removing'

  try{
    /*****
    * Put showNotification_ContentScript script in straight away so we can notify user of success/failure.
    * Need to check first if it is already running on the page as it has a message listener & multiple
    * showNotification_ContentScript scripts will mean multiple listeners and multiple notifications.
    */
    const contentScriptResponse = await sendMessageToNotifyContentScript({notifyScriptRunningCheck: true})

    if(!safeGetObjectProperty(contentScriptResponse, 'scriptAlreadyInserted')){
      /*****
      * insertContentScript returns a promise. await till the content script is ready.
      */
      await insertContentScript('showNotification_ContentScript.build.js')
    }
    /*****
    * If they havent yet saved the MarkSearch token to the extension settings page, then throw.
    * Note: we need to wait until the showNotification_ContentScript is inserted before we check the tokens
    * are saved as we will need that content script to inform the user that they haven't saved the them.
    * We send the error info with sendMessageToNotifyContentScript in the catch at the end below.
    */
    if(!localStorage.marksearchServerAddress || !localStorage.marksearchApiToken){
      const noTokenError = new Error('token not saved in extension settings')
      noTokenError.noToken = true
      throw noTokenError
    }
    /*****
    * checkIfPageIsSaved() returns true if the page is already saved.
    * If it's already saved, remove it.
    */
    if(await checkIfPageIsSaved(tab.id)){
      /*****
      * removePageFromMarkSearch resolves true if it successfully removed the page 
      */
      action = 'removePage'
      const pageIsSavedInMarkSearch = await !removePageFromMarkSearch(tab.url)
      updateIcon(pageIsSavedInMarkSearch, tab.id)
      return sendMessageToNotifyContentScript({action, actionSucceeded: true})
    }
    /*****
    * If it's not saved, run the content script to save it.
    * Note: dont' have to worry about multiple sendPageData_ContentScript's being on the page as
    * it doesn't have any message/event listeners and just sends a single message straight away.
    * Note: don't need to await for insertContentScript('sendPageData_ContentScript.build.js')
    * to finish.
    * Note: the backgroundOnMessageHandler shows the notification that the page was saved (& updates
    * the icon) when the sendPageData_ContentScript sends sends the data back, so we dont
    * need to show a notification here or update the icon.
    */
    action = 'savePage'
    insertContentScript('sendPageData_ContentScript.build.js')
  }
  catch(error){
    /*****
    * If we get here then checkIfPageIsSaved or removePageFromMarkSearch didn't work, or there was no
    * token saved in the settings. Log error and notify the user.
    */
    errorLogger(error)
    sendMessageToNotifyContentScript(
      {
        action,
        actionSucceeded: false,
        errorMessage: createErrorMessageToShowUser(error, action),
        noTokens: error.noToken
      }
    )
  }
}

export { browserActionEventHandler }

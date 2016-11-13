
import path from 'path'

import { isWebUri } from 'valid-url'

function insertContentScript(scriptName){
  chrome.tabs.executeScript(
    null,
    {
      file: path.join('js', scriptName),
      runAt: 'document_end'
    }
  )
}

function getCurrentTabId(){
  return new Promise( resolve => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      tabs => {
        resolve(tabs[0].id)
      }
    )
  })
}

function getCurrentTabUrl(tabId){
  return new Promise( resolve => {
    chrome.tabs.get(tabId, tab => {
      resolve(tab.url)
    })
  })
}

function checkIfValidUrl(url){
  return new Promise((resolve, reject) => {
    if(!isWebUri(url)){
      const invalidUrlError = new Error('Invalid Url')
      /*****
      * getCurrentTabUrlInvalidUrl is to make it easier to filter out these in the error logger.
      */
      invalidUrlError.getCurrentTabUrl_InvalidUrl = true
      reject(invalidUrlError)
    }
    else{
      resolve(url)
    }
  })
}

/*****
* @param {Object} error - thrown Error object.
* @param {string} error.message
* @param {string} action - could be 'saving' (from savePageToMarkSearch),
*                          or 'saving or removing', 'removedPage', 'savePage' from browserActionHandler.
*/
function createErrorMessageToShowUser(error, action){
  let returnedErrorMessage
  if(error && error.message){
    returnedErrorMessage = error.message
  }
  /*****
  * If it's 'saving or removing' or 'removedPage', then we want to say 'from' MarkSearch.
  */
  let toOrFromMarkSearch = 'from'
  if(action === 'savePage'){
    toOrFromMarkSearch = 'to'
  }

  const errorMessageToDisplay = `There was an error ${ action }
    this page ${ toOrFromMarkSearch } MarkSearch${ returnedErrorMessage ? `:  ${ returnedErrorMessage }.` : `.` }
    ${ (returnedErrorMessage === 'Failed to fetch') ? `Check the MarkSearch desktop app is running.` : `` }`

  return errorMessageToDisplay
}

export {
  getCurrentTabId,
  getCurrentTabUrl,
  checkIfValidUrl,
  insertContentScript,
  createErrorMessageToShowUser
}

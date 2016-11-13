
import path from 'path'
import { default as _get } from 'lodash.get'

import { isWebUri } from 'valid-url'

/*****
* Cause lodash.get on it's own will throw an error if the object is undefined. I would like it to just return
* a falsey value if the object is undefined.
*/
function getObjectProperty(obj, propertyName){
  if(!obj || !_get(obj, propertyName)){
    return
  }
  return propertyName
}

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
* @param {string} action - could be 'saving or removing' or 'removePage' or 'savePage'
*                           from browserActionHandler/savePageToMarkSearch.
*/
function createErrorMessageToShowUser(error, action){
  let returnedErrorMessage
  let actionAttempted = action
  /*****
  * If it's 'saving or removing' or 'removePage', then we want to say 'from' MarkSearch.
  */
  let toOrFromMarkSearch = 'from'

  if(getObjectProperty(error, 'message')){
    returnedErrorMessage = error.message
  }
  if(action === 'savePage'){
    toOrFromMarkSearch = 'to'
    actionAttempted = 'saving'
  }
  if(action === 'removePage'){
    actionAttempted = 'removing'
  }

  const errorMessageToDisplay = `There was an error ${ actionAttempted }
    this page ${ toOrFromMarkSearch } MarkSearch${ returnedErrorMessage ? `:  ${ returnedErrorMessage }.` : `.` }
    ${ (returnedErrorMessage === 'Failed to fetch') ? `Check the MarkSearch desktop app is running.` : `` }`

  return errorMessageToDisplay
}

export {
  getCurrentTabId,
  getCurrentTabUrl,
  checkIfValidUrl,
  insertContentScript,
  createErrorMessageToShowUser,
  getObjectProperty
}

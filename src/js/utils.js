
import path from 'path'
import { default as dotProp} from 'dot-prop'

import { isWebUri } from 'valid-url'

let $
let $$

if(document && document.querySelector){
  $ = document.querySelector.bind(document)
  $$ = document.querySelectorAll.bind(document)
}

/*****
* safeGetObjectProperty is for when the obj may not exist.
* It's a shortcut for obj && obj.prop (plus the dotProp 'a.b.c.d' feature).
*/
function safeGetObjectProperty(obj, propertyName){
  if(!obj){
    return
  }
  return dotProp.get(obj, propertyName)
}
/*****
* https://developer.chrome.com/extensions/storage#type-StorageArea
*/
function getSettings(keys = null){
  return new Promise( resolve => {
    /*****
    * Pass in null to get the entire contents of storage.
    */
    chrome.storage.local.get(keys, resolve)
  })
}

function insertContentScript(scriptName){
  return new Promise( resolve => {
    chrome.tabs.executeScript(
      null,
      {
        file: path.join('js', scriptName),
        runAt: 'document_end'
      },
      resolve
    )
  })
}

function getCurrentTabId(){
  return new Promise( (resolve, reject) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      tabs => {
        if(tabs && tabs[0] && tabs[0].id){
          resolve(tabs[0].id)
        }
        else{
          reject('Unable to get current tab id')
        }
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

  if(safeGetObjectProperty(error, 'message')){
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
  $,
  $$,
  getCurrentTabId,
  getCurrentTabUrl,
  checkIfValidUrl,
  insertContentScript,
  createErrorMessageToShowUser,
  safeGetObjectProperty,
  getSettings
}

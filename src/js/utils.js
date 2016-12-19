import path from 'path'
import { default as lodashGet } from 'lodash.get'

import { isWebUri } from 'valid-url'

let $
let $$

if(document && document.querySelector){
  $ = document.querySelector.bind(document)
  $$ = document.querySelectorAll.bind(document)
}

function checkIfDev(){
  return new Promise(resolve => {
    chrome.management.getSelf( ({installType}) => {
      resolve(installType === 'development')
    })
  })
}

/*****
* safeGetObjectProperty is for when the obj may not exist, cause lodash will
* throw if obj is not defined.
* So it's a shortcut for obj && obj.prop (plus the lodash.get 'a.b.c.d' feature).
*/
function safeGetObjectProperty(obj = null, propertyName){
  return lodashGet(obj, propertyName)
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
/*****
* https://developer.chrome.com/extensions/tabs#method-executeScript
* The first param for executeScript is the tabId, which "defaults to the active tab of the current window"
*/
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
  return new Promise( resolve => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      tabs => {
        resolve(safeGetObjectProperty(tabs, '[0].id'))
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
* @param {object} error - thrown Error object.
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

/*****
* @param {(string|undefined)} extensionTokenAndServerAddressString
* http://usejsdoc.org/tags-param.html
* http://usejsdoc.org/tags-type.html#jsdoc-types
*/
function syncServerAddressAndApiTokenInLocalStorage(extensionTokenAndServerAddressString){
  if(typeof extensionTokenAndServerAddressString !== 'string' ||
      !isWebUri(extensionTokenAndServerAddressString.split(',')[0])
    ){
    localStorage.removeItem('marksearchServerAddress')
    localStorage.removeItem('marksearchApiToken')
    return
  }
  const splitExtensionTokenAndServerAddressString = extensionTokenAndServerAddressString.split(',')
  localStorage.marksearchServerAddress = splitExtensionTokenAndServerAddressString[0]
  localStorage.marksearchApiToken = splitExtensionTokenAndServerAddressString[1]
}

function generateMassTempResultsForDev(markSearchResults){
  let tempResults = []
  if(markSearchResults[0]){
    tempResults = Array(500)
                    .fill(markSearchResults[0])
                    .map((item, index) =>
                      Object.assign({}, item, {pageTitle: `${ item.pageTitle } ${ index + 1 }`})
                      // Object.assign(
                      //   {},
                      //   item,
                      //   {
                      //     pageTitle: `${ item.pageTitle } ${ index + 1 }`,
                      //     pageUrl: item.pageUrl.repeat(10)
                      //   }
                      // )
                    )
  }
  return tempResults
}

export {
  $,
  $$,
  checkIfDev,
  getCurrentTabId,
  getCurrentTabUrl,
  checkIfValidUrl,
  insertContentScript,
  createErrorMessageToShowUser,
  safeGetObjectProperty,
  getSettings,
  syncServerAddressAndApiTokenInLocalStorage,
  generateMassTempResultsForDev
}

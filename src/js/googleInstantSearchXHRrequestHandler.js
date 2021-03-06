import { searchMarkSearch } from './searchMarkSearch'
import { getCurrentTabId } from './utils'
import { parseDateFilter } from './contentScripts/google/googleSearchCSutils'
import { errorLogger } from './errorLogger'

import { parse as parseQueryString } from 'query-string'

/*****
* request details object details here: https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
*
* Note: if you're worried about variables being overwritten by successive calls to googleInstantSearchXHRrequestHandler
* before searchMarkSearch() has completed, it seems that async functions take care of
* that: http://stackoverflow.com/a/28250697, also you can check with the following code:http://bit.ly/2hLxYX1 on https://esnextb.in/
*/
async function googleInstantSearchXHRrequestHandler({requestId, tabId, method, type, url}){
  const currentTabId = await getCurrentTabId()
  /*****
  * tabId will be -1 if the request isn't related to a tab.
  */
  if(tabId === -1 || method.toLowerCase() !== 'get' || type !== 'xmlhttprequest' || currentTabId !== tabId){
    return
  }
  /*****
  * We send a message early before querying MarkSearch server so we can reset some
  * things in the content script.
  */
  chrome.tabs.sendMessage(currentTabId, {newGoogleInstantSearchOccured: true, requestId})

  const requestUrl = new URL(url)
  const urlSearchParams = parseQueryString(requestUrl.search)
  const searchTerms = urlSearchParams.q
  const dateFilter = getDateFilterFromUrl(urlSearchParams)
  let searchResults = []

  try{
    searchResults = await searchMarkSearch(searchTerms, dateFilter)
  }
  catch(err){
    errorLogger(err)
  }

  chrome.tabs.sendMessage(currentTabId, {searchResults, requestId, searchTerms})
}

function getDateFilterFromUrl(urlSearchParams){
  const dateFilterParams = urlSearchParams.tbs
  if(!dateFilterParams || !dateFilterParams.length){
    return
  }
  return parseDateFilter(dateFilterParams)
}

export {
  googleInstantSearchXHRrequestHandler
}

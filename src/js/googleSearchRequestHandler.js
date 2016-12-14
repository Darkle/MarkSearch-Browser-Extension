import { searchMarkSearch } from './searchMarkSearch'
import { getCurrentTabId } from './utils'
import { parseDateFilter } from './contentScripts/google/googleSearchCSutils'
import { errorLogger } from './errorLogger'

function getDateFilterFromUrl(urlSearchParams){
  const tbs = urlSearchParams.get('tbs')
  if(!tbs || !tbs.length){
    return
  }
  return parseDateFilter(tbs)
}

/*****
* request details object details here: https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
*/
async function googleSearchRequestHandler(contentScriptPort, {tabId: requestTabId, method, type, url}){
  const currentTabId = await getCurrentTabId()
  /*****
  * tabId will be -1 if the request isn't related to a tab.
  */
  if(!contentScriptPort ||
    requestTabId === -1 ||
    method.toLowerCase() !== 'get' ||
    type !== 'xmlhttprequest' ||
    currentTabId !== requestTabId
  ){
    return
  }

  /*****
  * We send a message early before querying MarkSearch server so we can reset some
  * things in the content script.
  */
  contentScriptPort.postMessage({googleInstantSearchOccured: true})

  const requestUrl = new URL(url)
  const urlSearchParams = new URLSearchParams(requestUrl.search)
  const searchTerms = urlSearchParams.get('q')
  const dateFilter = getDateFilterFromUrl(urlSearchParams)
  console.log('googleSearchRequestHandler')

  let searchResults = []
  try{
    searchResults = await searchMarkSearch(searchTerms, dateFilter)
  }
  catch(err){
    errorLogger(err)
  }
  console.log('searchResults in googleSearchRequestHandler:', searchResults)
  contentScriptPort.postMessage(searchResults)
}

export {
  googleSearchRequestHandler
}

import { getCurrentTabId } from './utils'
import { parseDateFilter } from './contentScripts/google/googleSearchCSutils'

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
function googleWebRequestHandler({tabId: requestTabId, method, type, url}){
  /*****
  * tabId will be -1 if the request isn't related to a tab.
  */
  if(requestTabId === -1 || method.toLowerCase() !== 'get' || type !== 'xmlhttprequest'){
    return
  }

  getCurrentTabId().then(currentTabId => {
    if(requestTabId === currentTabId){
      const requestUrl = new URL(url)
      const urlSearchParams = new URLSearchParams(requestUrl.search)
      const searchTerms = urlSearchParams.get('q')
      const dateFilter = getDateFilterFromUrl(urlSearchParams)
      console.log('googleWebRequestHandler')
    }
  })

}

export {
  googleWebRequestHandler
}

import { searchMarkSearch } from './searchMarkSearch'
import { googleWebRequestHandler } from './googleWebRequestHandler'
import { googleUrlPatterns } from './googleUrls'
import { errorLogger } from './errorLogger'

// function contentScriptPageLoadSearchRequest(port){
//   port.onMessage.addListener( ({searchTerms, dateFilter}) => {
//     searchMarkSearch(searchTerms, dateFilter)
//       .then(searchResults => {
//         port.postMessage(searchResults)
//       })
//       .catch(errorLogger)
//   })
// }

function contentScriptInstantSearchRequest(port){
  /*****
  * We don't need to listen for messages, just send them. Can't really do it in reverse
  */
  chrome.webRequest.onBeforeRequest.addListener(
    ({tabId: requestTabId, method, type, url}) => {
      googleWebRequestHandler(port, requestTabId, method, type, url)
    },
    {
      urls: googleUrlPatterns,
      types: ['main_frame', 'xmlhttprequest']
    }
  )
}

export {
  contentScriptPageLoadSearchRequest,
  contentScriptInstantSearchRequest
}

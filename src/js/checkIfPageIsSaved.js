
import { isWebUri } from 'valid-url'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'

/*****
* Note: not doing any caching of bookmarkedUrls like http://bit.ly/2fEPFpu because the bookmark could have
* been deleted on the MarkSearch server webpage and our cache in this extension would not match up.
*/
function checkIfPageIsSaved(tabId){
  return new Promise( (resolve, reject) => {
    if(!marksearchServerAddress || !marksearchApiToken || !tabId){
      return reject()
    }

    chrome.tabs.get(tabId, tab => {
      if(!isWebUri(tab.url)){
        return reject()
      }

      const fetchUrl = `${ marksearchServerAddress }/api/get/${ encodeURIComponent(tab.url) }`
      const request = new Request(fetchUrl, {
        headers: new Headers({
          'Authorization': marksearchApiToken
        })
      })

      fetch(request).then( ({ status }) => {
        resolve((status === 200))
      })
    })
  })
}

export { checkIfPageIsSaved }

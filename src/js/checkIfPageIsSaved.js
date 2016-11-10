
import { isWebUri } from 'valid-url'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'

/*****
* Store a cache of already bookmarked urls. The urls are stored and deleted here as well as
* in removePageFromMarkSearch.js
*/
const bookmarkedURLs = new Set()

/*****
* Check if the web page is saved in MarkSearch
*/
function checkIfPageIsSaved(tabId){
  return new Promise( (resolve, reject) => {
    if(!marksearchServerAddress || !marksearchApiToken || !tabId){
      return reject()
    }
// console.log('checkIfPageIsSaved 1')
// console.log('marksearchServerAddress', marksearchServerAddress)
// console.log('marksearchApiToken', marksearchApiToken)
    chrome.tabs.get(tabId, tab => {
      let bookmarkIsSaved = false

      if(!tab.url || !isWebUri(tab.url)){
        return reject()
      }
// console.log('checkIfPageIsSaved chrome.tabs.get')
// console.log('tab.url', tab.url)
      if(bookmarkedURLs.has(tab.url)){
        console.log('bookmarkedURLs.has(tab.url) is true!')
        bookmarkIsSaved = true
        return resolve(bookmarkIsSaved)
      }
      const fetchUrl = `${ marksearchServerAddress }/api/get/${ encodeURIComponent(tab.url) }`
      const request = new Request(fetchUrl, {
        headers: new Headers({
          'Authorization': marksearchApiToken
        })
      })

      fetch(request).then( ({ status }) => {
        if(status === 200){
          bookmarkIsSaved = true
          bookmarkedURLs.add(tab.url)
        }
        else{
          bookmarkedURLs.delete(tab.url)
        }
        resolve(bookmarkIsSaved)
      })
    })
  })
}

export { checkIfPageIsSaved, bookmarkedURLs }

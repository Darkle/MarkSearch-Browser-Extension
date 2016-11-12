
import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'
import { getCurrentTabUrl, checkIfValidUrl } from './utils'

/*****
* Note: not doing any caching of bookmarkedUrls like http://bit.ly/2fEPFpu because the bookmark could have
* been deleted on the MarkSearch server webpage and our cache in this extension would not match up.
*/
function checkIfPageIsSaved(tabId){
  return new Promise( (resolve, reject) => {
    if(!tabId){
      return reject(new Error('tabId is undefined'))
    }
    if(!marksearchServerAddress || !marksearchApiToken){
      return reject(new Error('token not saved in extension settings'))
    }

    getCurrentTabUrl(tabId)
      .then(checkIfValidUrl)
      .then(tabUrl => {
        const fetchUrl = `${ marksearchServerAddress }/api/get/${ encodeURIComponent(tabUrl) }`
        const request = new Request(fetchUrl, {
          headers: new Headers({
            'Authorization': marksearchApiToken
          })
        })
        return request
      })
      .then(fetch)
      .then( ({ status }) => {
        const statusIs200 = (status === 200)
        const statusIs404 = (status === 404)
        /*****
        * If it's not 200 or 404, then there has been some kind of issue on the server, so throw an error.
        */
        if(!statusIs200 && !statusIs404){
          throw new Error(`There was an error in the fetch request in checkIfPageIsSaved.
                          Status code returned from the MarkSearch server was not 200 or 404.`)
        }
        resolve(statusIs200)
      })
      .catch(reject)

  })
}

export { checkIfPageIsSaved }

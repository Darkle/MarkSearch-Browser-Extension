
import { isWebUri } from 'valid-url'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'

function removePageFromMarkSearch(urlToRemove){
  return new Promise( (resolve, reject) => {
    if(!isWebUri(urlToRemove)){
      /*****
      * returning here so code below isnt run
      */
      return reject(new Error('urlToRemove is not a valid url'))
    }
    const fetchUrl = `${ marksearchServerAddress }/api/remove/${ encodeURIComponent(urlToRemove) }`
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': marksearchApiToken
      }),
      method: 'DELETE'
    })

    fetch(request)
      .then( ({ status }) => {
        const statusIs200 = (status === 200)
        if(!statusIs200){
          throw new Error(`There was an error in the fetch request in removePageFromMarkSearch.
                          Status code returned from the MarkSearch server was not 200.`)
        }
        resolve(statusIs200)
      })
      .catch(reject)
  })
}

export { removePageFromMarkSearch }

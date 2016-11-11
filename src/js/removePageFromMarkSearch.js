
import { isWebUri } from 'valid-url'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'

function removePageFromMarkSearch(urlToRemove){
  return new Promise( (resolve, reject) => {
    if(!isWebUri(urlToRemove)){
      return reject()
    }
    const fetchUrl = `${ marksearchServerAddress }/api/remove/${ encodeURIComponent(urlToRemove) }`
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': marksearchApiToken
      }),
      method: 'DELETE'
    })

    return resolve(fetch(request))
  })
}

export { removePageFromMarkSearch }

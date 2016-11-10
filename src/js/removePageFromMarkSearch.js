
import { isWebUri } from 'valid-url'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'
import { bookmarkedURLs } from './checkIfPageIsSaved'

function removePageFromMarkSearch(urlToRemove){
  return new Promise( (resolve, reject) => {
    if(!urlToRemove || !isWebUri(urlToRemove)){
      return reject()
    }
    const fetchUrl = `${ marksearchServerAddress }/api/remove/${ encodeURIComponent(urlToRemove) }`
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': marksearchApiToken
      }),
      method: 'DELETE'
    })

    return resolve(
      fetch(request)
        .then(
          () => {
            bookmarkedURLs.delete(urlToRemove)
          }
        )
      );  // eslint-disable-line
  })
}

export { removePageFromMarkSearch }

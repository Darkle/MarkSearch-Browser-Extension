
import { isWebUri } from 'valid-url'

import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'
import { pageDataSchema } from './pageDataSchema'

function savePageToMarkSearch(pageData){
  return new Promise( (resolve, reject) => {
    /*****
    * validate will throw and the promise will exit if it fails validation
    */
    validate(pageData, pageDataSchema)



    // if(!urlToRemove || !isWebUri(urlToRemove)){
    //   return reject()
    // }
    // const fetchUrl = `${ marksearchServerAddress }/api/remove/${ encodeURIComponent(urlToRemove) }`
    // const request = new Request(fetchUrl, {
    //   headers: new Headers({
    //     'Authorization': marksearchApiToken
    //   }),
    //   method: 'DELETE'
    // })
    //
    // return resolve(fetch(request))
  })
}

export { savePageToMarkSearch }

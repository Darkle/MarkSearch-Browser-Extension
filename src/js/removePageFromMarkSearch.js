
import { marksearchServerAddress, marksearchApiToken } from './serverAddressAndToken'

function removePageFromMarkSearch(urlToRemove){
  return new Promise( (resolve, reject) => {
    /*****
    * Don't need to bother checking for valid url here as removePageFromMarkSearch is only called
    * in the browserActionHandler, and it calls checkIfPageIsSaved first, which checks the url is
    * a valid web url.
    */
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
                          Status code returned from the MarkSearch server was not 200`)
        }
        resolve(statusIs200)
      })
      .catch(reject)
  })
}

export { removePageFromMarkSearch }

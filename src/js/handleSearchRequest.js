
import { errorLogger } from './errorLogger'

function handleSearchRequest(port){
  port.onMessage.addListener( ({searchTerms}) => {
    const fetchUrl = `${ localStorage.marksearchServerAddress }/api/search/${ encodeURIComponent(searchTerms) }`
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': localStorage.marksearchApiToken
      }),
      method: 'GET'
    })

    fetch(request)
      .then( response => {
        /*****
        * Not bothering to check for a 403 Forbidden or other server issue as we dont want to bother the user
        * when they are doing a google/duckduckgo/baidu search.
        */
        if(response.ok){
          return response.json()
        }
        throw new Error(`handleSearchRequest fetch server issue. Response was ${ response.status }`)
      })
      .then(searchResults => port.postMessage(searchResults))
      .catch(errorLogger)
  })
}

export { handleSearchRequest }

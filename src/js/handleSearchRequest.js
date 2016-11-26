
import { safeGetObjectProperty } from './utils'
import { errorLogger } from './errorLogger'

function handleSearchRequest(port){
  port.onMessage.addListener( ({searchTerms, dateFilter}) => {
    console.log('handleSearchRequest')
    console.log('searchTerms', searchTerms)
    console.log('dateFilter', dateFilter)
    /*****
    * If dateFilterStartDate or dateFilterEndDate is undefined, MarkSearch will ignore them on the server
    * side.
    */
    const dateFilterStartDate = safeGetObjectProperty(dateFilter, 'startDate')
    const dateFilterEndDate = safeGetObjectProperty(dateFilter, 'endDate')
    const fetchUrl = `${ localStorage.marksearchServerAddress }/api/search/${ encodeURIComponent(searchTerms) }`
    /*****
    * Post cause we have to post the dateFilter data.
    */
    const request = new Request(fetchUrl, {
      headers: new Headers({
        'Authorization': localStorage.marksearchApiToken
      }),
      method: 'POST',
      body: JSON.stringify({
        dateFilterStartDate,
        dateFilterEndDate
      })
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
      .then(searchResults => {
        console.log('search response ok')
        console.log('searchResults', searchResults)
        port.postMessage(searchResults)
      })
      .catch(errorLogger)
  })
}

export { handleSearchRequest }

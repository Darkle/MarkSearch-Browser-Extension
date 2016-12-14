import { safeGetObjectProperty } from './utils'

function searchMarkSearch(searchTerms, dateFilter){
  /*****
  * If dateFilterStartDate or dateFilterEndDate is undefined, MarkSearch will ignore them on the server
  * side.
  */
  const dateFilterStartDate = safeGetObjectProperty(dateFilter, 'startDate')
  const dateFilterEndDate = safeGetObjectProperty(dateFilter, 'endDate')
  const fetchUrl = `${ localStorage.marksearchServerAddress }/api/search/${ encodeURIComponent(searchTerms) }`
  /*****
  * Post cause we have to post the dateFilter data.
  * dateFilterStartDate & dateFilterEndDate are the property names the MS server is looking for when it receives the
  * post request.
  */
  const request = new Request(fetchUrl, {
    headers: new Headers({
      'Authorization': localStorage.marksearchApiToken,
      'Content-type': 'application/json;charset=utf-8'
    }),
    method: 'POST',
    body: JSON.stringify({
      dateFilterStartDate,
      dateFilterEndDate
    })
  })

  return fetch(request)
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
}

export {
  searchMarkSearch
}

import { getSetting } from './CS_utils'
import { safeGetObjectProperty } from '../utils'

function searchMarkSearch_CS(searchTerms, dateFilter){
  /*****
  * If dateFilterStartDate or dateFilterEndDate is undefined, MarkSearch will ignore them on the server
  * side.
  */
  const dateFilterStartDate = safeGetObjectProperty(dateFilter, 'startDate')
  const dateFilterEndDate = safeGetObjectProperty(dateFilter, 'endDate')
  const fetchUrl = `${ getSetting('marksearchServerAddress') }/api/search/${ encodeURIComponent(searchTerms) }`
  /*****
  * Post cause we have to post the dateFilter data.
  * dateFilterStartDate & dateFilterEndDate are the property names the MS server is looking for when it receives the
  * post request.
  */
  console.log('dateFilterStartDate', dateFilterStartDate)
  console.log('dateFilterEndDate', dateFilterEndDate)
  console.log('fetchUrl', fetchUrl)
  console.log(`getSetting('marksearchApiToken')`, getSetting('marksearchApiToken'))
  console.log(`getSetting('msResultsBox')`, getSetting('msResultsBox'))

  const request = new Request(fetchUrl, {
    headers: new Headers({
      'Authorization': getSetting('marksearchApiToken'),
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
      console.log('inside fetch')
      console.log(response)
      /*****
      * Not bothering to check for a 403 Forbidden or other server issue as we dont want to bother the user
      * when they are doing a google/duckduckgo search.
      */
      if(response.ok){
        return response.json()
      }
    })
}

export {
  searchMarkSearch_CS
}

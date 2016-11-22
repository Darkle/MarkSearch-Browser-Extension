
/*****
* Note: URLSearchParams is not available in Microsoft Edge yet, maybe use npm 'query-string'
*/
const pageQueryParams = new URLSearchParams(window.location.search)
/*****
* If there is a query string (?), then it's not instant search. Can't do it the
* other way, cause it's possible to have a hash on the end of a query string, but not vice versa (AFAIK)
*/
const isInstantSearch = !pageQueryParams.has('q')    //if there is a query string (?), then it's not instant search

function getSearchQueryFromUrl(){
  const pageHash = new URLSearchParams(window.location.hash)
  return isInstantSearch ? pageHash.get('q') : pageQueryParams.get('q')
}

export {
  getSearchQueryFromUrl,
  isInstantSearch
}

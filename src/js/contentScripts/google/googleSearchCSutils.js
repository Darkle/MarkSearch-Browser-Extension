import moment from 'moment'
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
  if(isInstantSearch){
    const pageHash = new URLSearchParams(window.location.hash)
    return pageHash.get('q')
  }
  return pageQueryParams.get('q')
}

function parseDateFilter(dateFilter){
  const dateFilterRange = {
    startDate: null,
    endDate: null,
  }
  const startDateShortcuts = {
    h: 'hour',
    d: 'day',
    w: 'week',
    m: 'month',
    y: 'year'
  }
  if(dateFilter.startsWith('qdr:')){
    dateFilterRange.endDate = moment.valueOf()
    const startDateShortcutText = startDateShortcuts[dateFilter.split('qdr:')[1]]
    console.log('startDateShortcutText', startDateShortcutText)
    dateFilterRange.startDate = moment().subtract(1, startDateShortcutText).valueOf()
  }
  if(dateFilter.startsWith('cdr:')){
    /*****
    * cdr example: cdr:1,cd_min:30/10/2016,cd_max:23/11/2016
    */
    const cdrStartDate = dateFilter.slice(dateFilter.indexOf('cd_min:') + 7, dateFilter.lastIndexOf(','))
    console.log('cdrStartDate', cdrStartDate)
    const cdrEndDate = dateFilter.slice(dateFilter.indexOf('cd_max:') + 7)
    console.log('cdrEndDate', cdrEndDate)
    dateFilterRange.startDate = moment(cdrStartDate, 'DD-MM-YYYY').startOf('day').valueOf()
    dateFilterRange.endDate = moment(cdrEndDate, 'DD-MM-YYYY').endOf('day').valueOf()
  }
  console.log('dateFilterRange', dateFilterRange)
  console.dir('dateFilterRange', dateFilterRange)
  return dateFilterRange
}

function getDateFilterFromUrl(){
  let tbs
  if(isInstantSearch){
    const pageHash = new URLSearchParams(window.location.hash)
    tbs = pageHash.get('tbs')
  }
  else{
    tbs = pageQueryParams.get('tbs')
  }
  if(!tbs){
    return
  }
  return parseDateFilter(tbs)
}

export {
  getSearchQueryFromUrl,
  getDateFilterFromUrl,
  parseDateFilter,
  isInstantSearch
}

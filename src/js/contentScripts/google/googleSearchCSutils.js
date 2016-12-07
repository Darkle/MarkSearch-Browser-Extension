import moment from 'moment'
/*****
* Note: URLSearchParams is not available in Microsoft Edge yet, maybe use npm 'query-string'
* .slice(1) to remove the ? at the start.
*/
const pageQueryParams = new URLSearchParams(window.location.search.slice(1))
/*****
* If there is a query string (?), then it's not instant search. Can't do it the
* other way, cause it's possible to have a hash on the end of a query string, but not vice versa (AFAIK)
*/
const isInstantSearch = !pageQueryParams.has('q')

function getPageHash(){
  /*****
  * .slice(1) to remove the # at the start.
  */
  const pageHash = new URLSearchParams(window.location.hash.slice(1))
  return pageHash
}

function getSearchQueryFromUrl(){
  if(isInstantSearch){
    return getPageHash().get('q')
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
    dateFilterRange.endDate = moment().valueOf()
    const startDateShortcutText = startDateShortcuts[dateFilter.split('qdr:')[1]]
    dateFilterRange.startDate = moment().subtract(1, startDateShortcutText).valueOf()
  }
  if(dateFilter.startsWith('cdr:')){
    /*****
    * cdr example: cdr:1,cd_min:30/10/2016,cd_max:23/11/2016
    * Note: google fixes it if you set an end date before the start date, or it reverts to the previous legit date
    * range - it does this by reloading the page (as a non-instant search).
    */
    const cdrStartDate = dateFilter.slice(dateFilter.indexOf('cd_min:') + 7, dateFilter.lastIndexOf(','))
    const cdrEndDate = dateFilter.slice(dateFilter.indexOf('cd_max:') + 7)
    dateFilterRange.startDate = moment(cdrStartDate, 'DD-MM-YYYY').startOf('day').valueOf()
    dateFilterRange.endDate = moment(cdrEndDate, 'DD-MM-YYYY').endOf('day').valueOf()
  }
  return dateFilterRange
}

function getDateFilterFromUrl(){
  let tbs = null
  if(isInstantSearch){
    tbs = getPageHash().get('tbs')
  }
  else{
    tbs = pageQueryParams.get('tbs')
  }
  if(!tbs || !tbs.length){
    return
  }
  return parseDateFilter(tbs)
}

function setMSiconClass(msSidebarIcon, msSidebarIconTop){
  const containsClass = msSidebarIcon.classList.contains('msSidebarIconFixed')
  const winScrollY = window.scrollY

  if(!containsClass && winScrollY >= msSidebarIconTop){
    msSidebarIcon.classList.add('msSidebarIconFixed')
  }
  if(containsClass && winScrollY < msSidebarIconTop){
    msSidebarIcon.classList.remove('msSidebarIconFixed')
  }
}

export {
  getSearchQueryFromUrl,
  getDateFilterFromUrl,
  parseDateFilter,
  isInstantSearch,
  setMSiconClass
}

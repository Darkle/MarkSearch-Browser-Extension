import { getSetting } from '../CS_utils'
import { safeGetObjectProperty } from '../../utils'

import moment from 'moment'
import { parse as parseQueryString } from 'query-string'
/*****
* Originally I was using the url search params to check if the page was set to do instant search by
* checking if there were search query params (e.g. search?q=skyrim) in the url, but unfortunately it's possible
* to have search params present and still be in instant search; the url would look something
* like this (logged out): https://www.google.co.uk/search?q=skyrim+walkthrough+ps3#q=skyrim+walkthrough+pdf
* I cant seem to find anything in the cookies or local/session storage to indicate that it's instant search either.
* Then I was going to check the html on the page as it seemed that if it was instant search, the
* #tsf>input[value="psy-ab"][name="sclient"] element would be on the page, but I found that seemed to only be the
* case for English based google search pages, so gonna fall back to the user setting the search type in the extension
* settings.
* Note: we can still use search params to get the search query quickly though.
* Note: query-string automatically removes the ? or # at the start.
*/

function checkIfInstantSearch(){
  return getSetting('isInstantSearch') === 'instant'
}

const isInstantSearch = checkIfInstantSearch()

function getUrlHashParams(){
  return parseQueryString(window.location.hash)
}

function getUrlQueryParams(){
  return parseQueryString(window.location.search)
}

function getSearchQueryFromUrl(){
  const urlHashParams = getUrlHashParams().q
  const urlQueryParams = getUrlQueryParams().q
  /*****
  * Normally instant search uses hash params for the search, but on occasion it will use the query
  * params (?q=foo) instead, so if there is not a hash param for instant search, return the query param.
  */
  if(isInstantSearch && urlHashParams){
    return urlHashParams
  }
  return urlQueryParams
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
  /*****
  * 'qdr:' is one of the date shortcuts that's available (i.e. not a custom range)
  */
  if(dateFilter.startsWith('qdr:')){
    dateFilterRange.endDate = moment().valueOf()
    const startDateShortcutText = startDateShortcuts[dateFilter.split('qdr:')[1]]
    dateFilterRange.startDate = moment().subtract(1, startDateShortcutText).valueOf()
  }
  /*****
  * 'cdr:' is a custom date range
  */
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
  let dateFilterParams = null
  if(isInstantSearch){
    dateFilterParams = getUrlHashParams().tbs
  }
  else{
    dateFilterParams = getUrlQueryParams().tbs
  }
  if(!dateFilterParams || !dateFilterParams.length){
    return
  }
  return parseDateFilter(dateFilterParams)
}

function checkIfMutationOccuredOnTargetElement(mutations, targetId){
  return mutations.find(({target: {id}}) => id === targetId)
}

function getAddedNodesForTargetElement(mutations, targetId){
  return safeGetObjectProperty(checkIfMutationOccuredOnTargetElement(mutations, targetId), 'addedNodes')
}

function getRemovedNodesForTargetElement(mutations, targetId){
  return safeGetObjectProperty(checkIfMutationOccuredOnTargetElement(mutations, targetId), 'removedNodes')
}

function findElementInNodeList(searchType, searchData, nodeList){
  if(!nodeList){
    return
  }
  if(searchType === 'nodeName'){
    return Array.from(nodeList).find(elem => elem.nodeName.toLowerCase() === searchData)
  }
  if(searchType === 'id'){
    return Array.from(nodeList).find(elem => elem.id === searchData)
  }
}
/*****
* We check the url params for the 'tbm' key as that indicates that it's not a general search.
*
* Notes:
*   * This is only for non-instant, as we cant rely on the tbm url param not being there on instant.
*   * We dont have to bother checking Flights search or Maps search, as they both are missing the '#lst-ib'
*   search input element, which we check for at the start of the googleSearch_ContentScript init().
*   * The document body contains the class 'hp' when it is on the search page (for both normal and instant search).
*   We have a css rule in our stylesheet to display: none for the MS results box when the page body has a class of
*   'hp', but we should check here for that class because this can prevent the MS results box from being created
*   and inserted, as there is no need for it to be inserted on the search page when it's not instant search.
*/
function generalResultsPageIsDisplayedForNonInstantSearch(){
  return !document.body.classList.contains('hp') && !getUrlHashParams().tbm && !getUrlQueryParams().tbm
}

export {
  checkIfInstantSearch,
  getSearchQueryFromUrl,
  getDateFilterFromUrl,
  parseDateFilter,
  checkIfMutationOccuredOnTargetElement,
  getAddedNodesForTargetElement,
  getRemovedNodesForTargetElement,
  findElementInNodeList,
  generalResultsPageIsDisplayedForNonInstantSearch,
}

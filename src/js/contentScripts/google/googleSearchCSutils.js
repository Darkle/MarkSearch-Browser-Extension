import { showMSresultsBox} from '../markSearchResultsBox'
import { safeGetObjectProperty, $ } from '../../utils'

import moment from 'moment'
import { parse as parseQueryString } from 'query-string'
/*****
* Originally I was using search params to check if the page was set to do instant search by
* checking if there were search query params (e.g. search?q=skyrim) in the url, but unfortunately it's possible
* to have search params present and still be in instant search; the url would look something
* like this (logged out): https://www.google.co.uk/search?q=skyrim+walkthrough+ps3#q=skyrim+walkthrough+pdf
* I cant seem to find anything in the cookies or local/session storage to indicate that it's instant search,
* so gonna check the html on the page. (we can still use search params to get the search query quickly
* though)
* Note: query-string automatically removes the ? or # at the start.
*/
const pageQueryParams = parseQueryString(window.location.search)
let isInstantSearch = false

function checkIfInstantSearch(){
  if(document.querySelector('#tsf>input[value="psy-ab"][name="sclient"]')){
    isInstantSearch = true
  }
  return isInstantSearch
}

function getPageHash(){
  return parseQueryString(window.location.hash)
}

function getSearchQueryFromUrl(){
  if(isInstantSearch){
    return getPageHash().q
  }
  return pageQueryParams.q
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
  let dateFilterParams = null
  if(isInstantSearch){
    dateFilterParams = getPageHash().tbs
  }
  else{
    dateFilterParams = pageQueryParams.tbs
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
* The document body contains the class 'hp' when it is on the search
* page (for both normal and instant search)
*/
function searchPageIsDisplayed(){
  return document.body.classList.contains('hp')
}
/*****
* We dont have to bother checking Flights search ( https://www.google.co.uk/flights/?hl=en#search;f=_;q=test) or
* Maps search, as they both are missing the '#lst-ib' search input element, which we check for at the start of the
* googleSearch_ContentScript init().
* For all others, if the navigation is there and the first one is selected (All), then it should be the general
* results pagae.
*/
function generalResultsPageIsDisplayed(){
  if(searchPageIsDisplayed()){
    return false
  }
  const searchTypesNavigationAllSearch = $('#hdtb-msb>div>div:first-of-type')
  if(searchTypesNavigationAllSearch && searchTypesNavigationAllSearch.classList.contains('hdtb-msel')){
    return true
  }
}

function showMSresultsBoxIfOnGeneralResultsPage(){
  if(!generalResultsPageIsDisplayed()){
    return
  }
  showMSresultsBox()
}

export {
  getSearchQueryFromUrl,
  getDateFilterFromUrl,
  parseDateFilter,
  checkIfInstantSearch,
  checkIfMutationOccuredOnTargetElement,
  getAddedNodesForTargetElement,
  getRemovedNodesForTargetElement,
  findElementInNodeList,
  generalResultsPageIsDisplayed,
  showMSresultsBoxIfOnGeneralResultsPage,
}

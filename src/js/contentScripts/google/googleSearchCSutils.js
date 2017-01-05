import { safeGetObjectProperty } from '../../utils'

import moment from 'moment'
/*****
* Originally I was using URLSearchParams() to check if the page was set to do instant search by
* checking if there were search query params (e.g. search?q=skyrim) in the url, but unfortunately it's possible
* to have search params present and still be in instant search; the url would look something
* like this (logged out): https://www.google.co.uk/search?q=skyrim+walkthrough+ps3#q=skyrim+walkthrough+pdf
* I cant seem to find anything in the cookies or local/session storage to indicate that it's instant search,
* so gonna check the html on the page. (we can still use URLSearchParams() to get the search query quickly
* though)
* Note: URLSearchParams is not available in Microsoft Edge yet, maybe use npm 'query-string'
* Note: .slice(1) to remove the ? or # at the start.
*/
const pageQueryParams = new URLSearchParams(window.location.search.slice(1))
let isInstantSearch = false

function checkIfInstantSearch(){
  if(document.querySelector('#tsf>input[value="psy-ab"][name="sclient"]')){
    isInstantSearch = true
  }
  return isInstantSearch
}

function getPageHash(){
  return new URLSearchParams(window.location.hash.slice(1))
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

export {
  getSearchQueryFromUrl,
  getDateFilterFromUrl,
  parseDateFilter,
  checkIfInstantSearch,
  checkIfMutationOccuredOnTargetElement,
  getAddedNodesForTargetElement,
  getRemovedNodesForTargetElement,
  findElementInNodeList,
  searchPageIsDisplayed,
}

import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { isInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, parseDateFilter } from './googleSearchCSutils'
import { renderMarkSearchResults } from './renderMarkSearchResults'
import { getSettings, $, safeGetObjectProperty } from '../../utils'

import debounce from 'lodash.debounce'

let searchInput
let searchRequestPort
let searchInputOldValue
let markSearchResults
let searchEngineResults
let searchEngineResultsHaveBeenInserted = false
let rsoElement
let dateFilterDropdownElementsHaveEventHandlers = false
let extensionSettings
let msResultsBoxResultsContainer

function sendSearchRequestToMarkSearch(searchTerms, dateFilter){
  if(!searchTerms){
    return
  }
  /*****
  * Note: we do a check in the handleSearchRequest.js background script to check if
  * dateFilter.startDate & dateFilter.endDate are not null/undefined
  */
  markSearchResults = null
  /*****
  * We dont have mutation observers when non-instant search, & also sendSearchRequestToMarkSearch is
  * only called once on non-instant search, so we dont need to reset searchEngineResultsHaveBeenInserted.
  */
  if(isInstantSearch){
    searchEngineResultsHaveBeenInserted = false
  }
  searchRequestPort.postMessage({searchTerms, dateFilter})
}

function onReceivedMarkSearchResults(searchResults){
  markSearchResults = searchResults
  if(searchEngineResultsHaveBeenInserted){
    renderMarkSearchResults(markSearchResults, rsoElement, searchEngineResults)
  }
}

function searchInputChangeHandler(){
  const searchInputValue = searchInput.value.trim().toLowerCase()
  if(searchInputValue !== searchInputOldValue){
    searchInputOldValue = searchInputValue
    sendSearchRequestToMarkSearch(searchInput.value, getDateFilterFromUrl())
  }
}

const debouncedSearchInputChangeHandler = debounce(
  searchInputChangeHandler,
  200,
  {
    'leading': false,
    'trailing': true
  }
)

function dateFilterDropdownElemListener(event){
  /*****
  * We cant use getDateFilterFromUrl() here as the url hasn't yet been updated by the js on the page, so
  * we're cheating a bit and getting the new filter from the filter drop down menu element id's. (the id's
  * look like this - 'qdr_h', 'qdr_m', 'qdr_d' etc)
  *
  * Unfortunately we cant use a popstate event listener as that is not triggered when js changes the history, only
  * when a user clicks on something that changes the history - https://mzl.la/2giiSZf
  *
  * If it's the '#qdr_' (aka 'qdr:') element, then we re-do the search with no date filter as thats the element
  * that clears the date filter on the page.
  *
  * Note: we need to reset dateFilterDropdownElementsHaveEventHandlers to false as the menu gets
  * removed & re-inserted after a date filter is clicked on and selected.
  */
  dateFilterDropdownElementsHaveEventHandlers = false
  let dateFilter = null
  const dateFilterElemId = event.currentTarget.id.replace('_', ':')
  if(dateFilterElemId !== 'qdr:'){
    dateFilter = parseDateFilter(dateFilterElemId)
  }
  sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), dateFilter)
}

function setUpDateFilterDropdownElementsEventHandlers(){
  dateFilterDropdownElementsHaveEventHandlers = true
  $('#qdr_').addEventListener('click', dateFilterDropdownElemListener)
  $('#qdr_d').addEventListener('click', dateFilterDropdownElemListener)
  $('#qdr_h').addEventListener('click', dateFilterDropdownElemListener)
  $('#qdr_w').addEventListener('click', dateFilterDropdownElemListener)
  $('#qdr_m').addEventListener('click', dateFilterDropdownElemListener)
  $('#qdr_y').addEventListener('click', dateFilterDropdownElemListener)
  /*****
  * Note: there's no listener for the custom range dropdown link as it seems
  * to reload the page and convert the search to non-instant.
  */
}

function mutationObserverHandler(mutations){
  if(!dateFilterDropdownElementsHaveEventHandlers){
    const menuIsInserted = mutations.find(({target: {id}}) => id === 'hdtbMenus')
    if(menuIsInserted){
      setUpDateFilterDropdownElementsEventHandlers()
    }
  }
  const addedResultNodes = safeGetObjectProperty(mutations.find(({target: {id}}) => id === 'search'), 'addedNodes')
  if(!addedResultNodes){
    return
  }
  searchEngineResultsHaveBeenInserted = true
  /*****
  * The first item in the addedResultNodes NodeList is usually a style element,
  * so start with the second which is a container div (but check first).
  */
  const nodePosition = addedResultNodes[0].matches('style') ? 1 : 0
  rsoElement = addedResultNodes[nodePosition].querySelector('#rso')
  searchEngineResults = rsoElement.querySelectorAll('.g')
  if(markSearchResults){
    renderMarkSearchResults(markSearchResults, rsoElement, searchEngineResults)
  }
}

function setMSiconClass(msSidebarIcon, msSidebarIconTop){
  if(window.scrollY >= msSidebarIconTop){
    msSidebarIcon.classList.add('msSidebarIconFixed')
  }
  else{
    msSidebarIcon.classList.remove('msSidebarIconFixed')
  }
}

function setUpMSresultsBox(settings){
  /*****
  *
  */
  const msResultsBoxElem = document.createElement('div')
  msResultsBoxElem.setAttribute('id', 'msResultsBox')
  msResultsBoxElem.setAttribute('style', `height:${ $('#res').clientHeight }px;`)

  const resultsBoxSideBar = document.createElement('div')
  resultsBoxSideBar.setAttribute('id', 'msResultsBoxSidebar')
  resultsBoxSideBar.addEventListener('click', () => {
    //will need to be http://caniuse.com/#search=animation
  })
  msResultsBoxElem.appendChild(resultsBoxSideBar)

  const msSidebarIcon = document.createElement('div')
  msSidebarIcon.setAttribute('id', 'msSidebarIcon')
  msSidebarIcon.textContent = 'MS'
  resultsBoxSideBar.appendChild(msSidebarIcon)

  msResultsBoxResultsContainer = document.createElement('div')
  msResultsBoxResultsContainer.setAttribute('id', 'msResultsBoxResultsContainer')
  msResultsBoxElem.appendChild(msResultsBoxResultsContainer)

  if(settings.msResultsBox_Position === 'left'){
    msResultsBoxElem.classList.add('showMsResultsBoxOnLeft')
  }
  if(settings.msResultsBox_ShowViaAlwaysShow){
    msResultsBoxElem.classList.add('forceShowMsResultsBox')
  }
  /*****
  * We don't insert into the #rcnt element as it has a max-width set and doesn't expand fully,
  * and we don't insert higher up as we want the results box to be under the google
  * toolbars/buttons.
  */
  const rcnt = $('#rcnt')
  rcnt.parentNode.insertBefore(msResultsBoxElem, rcnt)

  /*****
  * Gonna do this as a constant rather than computed as it wont change and still seems to
  * work ok even if the page is zoomed in.
  */
  // const computedMsSidebarIconTop = msSidebarIcon.getBoundingClientRect().top + scrollY
  const computedMsSidebarIconTop = 167

  setMSiconClass(msSidebarIcon, computedMsSidebarIconTop)
  window.addEventListener('scroll',
    () => {
      setMSiconClass(msSidebarIcon, computedMsSidebarIconTop)
    },
    {
      passive: true
    }
  )
}

function init(settings){
  /*****
  * reference settings to a variable so we can export it
  */
  extensionSettings = settings
  searchInput = $('#lst-ib')
  /*****
  * We wanna exit early if it's not a search page or they dont have integrated results enabled in the settings.
  */
  if(!settings.integrateWithGoogleSearch || !searchInput){
    return
  }
  if(settings.msResultsBox){
    setUpMSresultsBox(settings)
  }
  if(isInstantSearch){
    /*****
    * Set up listeners/observers for instant search.
    * Note: The date filter dropdown menu elements aren't ready on DOMContentLoaded or on window load,
    * so grab them after they've been inserted - the call to set up their event listeners is
    * done in the mutationObserverHandler.
    */
    searchInput.addEventListener('input', debouncedSearchInputChangeHandler)
    searchInput.addEventListener('change', debouncedSearchInputChangeHandler)

    const observer = new MutationObserver(mutationObserverHandler)

    observer.observe(
      $('#main'),
      {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
        attributeOldValue: false,
        characterDataOldValue: false
      }
    )
    /*****
    * We need to check for popstate events for when the user clicks back/forward in the browser
    * while using instant search.
    * Note: unfortunately we cant use a popstate event listener to listen for url changes elsewhere, as it's
    * only fired when a user clicks the back/forward button in browser or clicks on a link on the page: https://mzl.la/2giiSZf
    */
    window.addEventListener('popstate', () => {
      /*****
      * The date filter menu dropdown gets removed & re-inserted, so set dateFilterDropdownElementsHaveEventHandlers
      * to false to get mutation observer above to re-attach event handlers.
      */
      dateFilterDropdownElementsHaveEventHandlers = false
      sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), getDateFilterFromUrl())
    })
  }
  else{
    searchEngineResultsHaveBeenInserted = true
    rsoElement = $('#rso')
    searchEngineResults = rsoElement.querySelector('g')
  }
  searchRequestPort = chrome.runtime.connect({name: 'contentScriptSearchRequest'})
  searchRequestPort.onMessage.addListener(onReceivedMarkSearchResults)
  /*****
  * Do the inital search for the terms on page load.
  * Note: the searchInput.value isn't available quite yet, so grab search terms
  * (and date filter if being used) from window location hash/query params.
  */
  sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), getDateFilterFromUrl())
}

document.addEventListener('DOMContentLoaded', () => getSettings().then(init))

export {
  extensionSettings,
  msResultsBoxResultsContainer
}

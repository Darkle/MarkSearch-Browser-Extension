import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { isInstantSearch, checkIfInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, parseDateFilter, getAddedResultNodes } from './googleSearchCSutils'
import { renderMarkSearchResults } from './renderMarkSearchResults'
import { initMSresultsBox } from './setUpMSresultsBox'
import { getSettings, $ } from '../../utils'

import debounce from 'lodash.debounce'

const observerSettings = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
  attributeOldValue: false,
  characterDataOldValue: false
}
let latestSearchTerms
let searchInput
let searchRequestPort
let searchInputOldValue
let markSearchResults
let searchEngineResults
let searchEngineResultsHaveBeenInserted = false
let rsoElement
let dateFilterDropdownElementsHaveEventHandlers = false
let extensionSettings
/*****
* reference settings to a variable so we can export it
*/
getSettings().then( settings => {
  extensionSettings = settings
})

/*****
* We send a search request to a background script to do the http request for us because
* although it is possible to make cross-origin requests in a content script, you need to
* know ahead of time the url/IP of the server address for the manifest for the extension,
* and there is no way to know ahead of time what IP address the MarkSearch server will be
* using, so we cant really give the content script cross-origin permissions.
* https://developer.chrome.com/extensions/xhr
*/
function sendSearchRequestToMarkSearch(searchTerms, dateFilter){
  if(!searchTerms){
    return
  }
  latestSearchTerms = searchTerms
    console.log('sendSearchRequestToMarkSearch latestSearchTerms', latestSearchTerms)
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

function renderMarkSearchResultsIfReady(){
  if(searchEngineResultsHaveBeenInserted && markSearchResults){
    console.log('renderMarkSearchResultsIfReady latestSearchTerms', latestSearchTerms)
    renderMarkSearchResults(markSearchResults, rsoElement, searchEngineResults, latestSearchTerms)
  }
}

function onReceivedMarkSearchResults(searchResults){
  markSearchResults = searchResults
  renderMarkSearchResultsIfReady()
}

function searchInputChangeHandler(){
  console.log('searchInputChangeHandler called')
  const searchInputValue = searchInput.value.trim().toLowerCase()
  console.log('searchInputValue', searchInputValue)
  console.log('searchInputOldValue', searchInputOldValue)
  console.log('searchInputValue !== searchInputOldValue', searchInputValue !== searchInputOldValue)
  if(searchInputValue !== searchInputOldValue){
    searchInputOldValue = searchInputValue
    sendSearchRequestToMarkSearch(searchInputValue, getDateFilterFromUrl())
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
  /*****
  * getAddedResultNodes finds a mutation that added stuff to the #search element, then returns
  * the addedNodes NodeList from that mutation if it's there.
  */
  const addedResultNodes = getAddedResultNodes(mutations)

  if(!addedResultNodes){
    return
  }
  /*****
  * The first item in the addedResultNodes NodeList is usually a style element,
  * with the second one being a div (which is the one we want), so find that one.
  * Also, on page load for non instant search, the page inserts comments into the
  * #results element, so just on the off chance it does it sometimes on instant search
  * too, this .find check for nodeName should also filter comment nodes out too, as a
  * nodeName for a comment element is '#comment'.
  * The zomgWeFoundADiv div is a first child of the #search element
  */
  const zomgWeFoundADiv = Array.from(addedResultNodes).find(elem => elem.nodeName.toLowerCase() === 'div')

  if(!zomgWeFoundADiv){
    return
  }
  /*****
  * The #rso element is two child nodes down from the zomgWeFoundADiv div, so just gonna
  * use querySelector to grab it.
  */
  rsoElement = zomgWeFoundADiv.querySelector('#rso')

  if(!rsoElement){
    return
  }

  searchEngineResults = rsoElement.querySelectorAll('.g:not(#imagebox_bigimages)')

  if(!searchEngineResults || !searchEngineResults.length){
    return
  }

  searchEngineResultsHaveBeenInserted = true

  renderMarkSearchResultsIfReady()
}

function init(){
  searchInput = $('#lst-ib')
  /*****
  * We wanna exit early if it's not a search page or they dont have showOn_____Search results enabled in the extensionSettings.
  */
  if(!extensionSettings.showOnDuckduckgoSearch || !searchInput){
    return
  }
  checkIfInstantSearch()

  if(extensionSettings.msResultsBox){
    initMSresultsBox(isInstantSearch)
  }
  console.log('isInstantSearch', isInstantSearch)
  if(isInstantSearch){
    /*****
    * Set up listeners/observers for instant search.
    * Note: The date filter dropdown menu elements aren't ready on DOMContentLoaded or on window load,
    * so grab them after they've been inserted - the call to set up their event listeners is
    * done in the mutationObserverHandler.
    *
    * #main is the lowest down element in the tree (of what we want) that's available on DOMContentLoaded.
    */
    // searchInput.addEventListener('input', debounce(
    //   searchInputChangeHandler,
    //   200,
    //   {
    //     'leading': false,
    //     'trailing': true
    //   }
    //   )
    // )
    // Load: https://www.google.co.uk/search?q=skyrim+walkthrough+ps3#q=boston+map
// Then click search input and select "tourist map of boston"
// - It shows results for the previous search terms "boston map"     <-- issue
//
// so at the moment, seems like input change isnt being fired when select the autocomplete for search, which means its just the mutation observer that is running and its running with the old search terms cause the input handler hasnt updated them cause it hasnt been fired
// so it seems that the change event doesnt fire if the input was changed by javascript - ressearch that
// cant just add a click event, cause the user can also use the keyboard to select a autocomplete
//     searchInput.addEventListener('change', searchInputChangeHandler)

    const observer = new MutationObserver(mutationObserverHandler)

    observer.observe($('#main'), observerSettings)
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
      // const searchQuery = getSearchQueryFromUrl()
      // searchInputOldValue = searchQuery
      console.log('popstate getSearchQueryFromUrl()', getSearchQueryFromUrl())
      // console.log('popstate searchInput.value', searchInput.value)
      sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), getDateFilterFromUrl())
    })
  }
  else{
    searchEngineResultsHaveBeenInserted = true
    rsoElement = $('#rso')
    searchEngineResults = rsoElement.querySelectorAll('.g:not(#imagebox_bigimages)')
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

document.addEventListener('DOMContentLoaded', init)

export {
  extensionSettings
}

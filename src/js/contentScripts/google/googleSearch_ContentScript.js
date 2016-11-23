

console.log('google search content script inserted and running')
// import '../../styles/googleSearch_ContentScript.styl'
const { isInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, parseDateFilter } = require('./googleSearchCSutils')
const { renderMarkSearchResults, removeMarkSearchResults } = require('./renderMarkSearchResults')
const { getSettings, $, safeGetObjectProperty } = require('../../utils')

const debounce = require('lodash.debounce')

let searchInput
let searchRequestPort
let searchInputOldValue
let markSearchResults
let searchEngineResultsHaveBeenInserted = false
let rsoElement

function sendSearchRequestToMarkSearch(searchTerms, dateFilter){
  markSearchResults = null
  searchEngineResultsHaveBeenInserted = false
  searchRequestPort.postMessage({searchTerms, dateFilter})
}

function searchInputChangeHandler(){
  console.log('searchInputChangeHandler  ', searchInputChangeHandler)
  const searchInputValue = searchInput.value.trim().toLowerCase()
  if(searchInputValue !== searchInputOldValue){
    searchInputOldValue = searchInputValue
    sendSearchRequestToMarkSearch(searchInput.value, getDateFilterFromUrl())
  }
}

function onReceivedMarkSearchResults(searchResults){
  removeMarkSearchResults()
  if(!Array.isArray(searchResults) || !searchResults.length){
    return
  }
  markSearchResults = searchResults
  if(searchEngineResultsHaveBeenInserted){
    renderMarkSearchResults(markSearchResults, rsoElement)
  }
}

function mutationObserverHandler(mutations){
  const filteredMutation = mutations.filter(({type, target: {id}}) => (type === 'childList' && id === 'search'))[0]
  const addedNodes = safeGetObjectProperty(filteredMutation, 'addedNodes')

  if(!addedNodes){
    return
  }
  /*****
  * The first item in the addedNodes NodeList is usually a style element,
  * so grab the second which is a container div. But check first.
  */
  const divItemPosition = addedNodes[0].tagName.toLowerCase() === 'style' ? 1 : 0

  searchEngineResultsHaveBeenInserted = true
  rsoElement = addedNodes[divItemPosition].children.ires.children.rso

  if(markSearchResults){
    renderMarkSearchResults(markSearchResults, rsoElement)
  }
}

function dateFilterDropdownElemListener(event){
  /*****
  * We cant use getDateFilterFromUrl() here as it hasn't yet been updated by the js on the page, so
  * we're cheating a bit and getting the new filter from the filter drop down meny element id's.
  *
  * If it's the '#qdr_' (aka 'qdr:') element, then we re-do the search with no date filter as thats the element
  * that clears the date filter on the page.
  */
  let dateFilter
  const dateFilterElemId = event.currentTarget.id.replace('_', ':')
  if(dateFilterElemId !== 'qdr:'){
    dateFilter = parseDateFilter(dateFilter)
  }
  sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), dateFilter)
}

function init(settings){
  /*****
  * We wanna exit early if it's not a search page or they dont have integrated results enabled in the settings.
  */
  if(!settings.integrateWithGoogleSearch){
    return
  }

  searchInput = document.querySelector('#lst-ib')

  if(!searchInput){
    return
  }

  searchRequestPort = chrome.runtime.connect({name: 'contentScriptSearchRequest'})

  searchRequestPort.onMessage.addListener(onReceivedMarkSearchResults)

  /*****
  * The searchInput.value isn't available quite yet, so grab search terms
  * from window location hash/query params.
  */
  sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), getDateFilterFromUrl())

  if(isInstantSearch){
    const debouncedSearchInputChangeHandler = debounce(
      searchInputChangeHandler,
      200,
      {
        'leading': false,
        'trailing': true
      }
    )

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
    * These elements aren't ready in DOMContentLoaded, so grab them on load.
    */
    window.addEventListener('load', () => {
      document.querySelector('#qdr_').addEventListener('click', dateFilterDropdownElemListener)
      document.querySelector('#qdr_h').addEventListener('click', dateFilterDropdownElemListener)
      document.querySelector('#qdr_d').addEventListener('click', dateFilterDropdownElemListener)
      document.querySelector('#qdr_w').addEventListener('click', dateFilterDropdownElemListener)
      document.querySelector('#qdr_m').addEventListener('click', dateFilterDropdownElemListener)
      document.querySelector('#qdr_y').addEventListener('click', dateFilterDropdownElemListener)
      /*****
      * Note: there's no listener for the custom range dropdown link as it seems
      * to reload the page and convert the search to non-instant.
      */
    })

  }
  else{
    searchEngineResultsHaveBeenInserted = true
    rsoElement = $('#rso')
  }
}

document.addEventListener('DOMContentLoaded', () => getSettings().then(init))



console.log('google search content script inserted and running')
// import '../../styles/googleSearch_ContentScript.styl'
const { isInstantSearch, getSearchQueryFromUrl } = require('./googleSearchCSutils')
const { renderMarkSearchResults, removeMarkSearchResults } = require('./renderMarkSearchResults')
const { getSettings, $, safeGetObjectProperty } = require('../../utils')

const debounce = require('lodash.debounce')

let searchInput
let searchRequestPort
let searchInputOldValue
let markSearchResults
let searchEngineResultsHaveBeenInserted = false
let rsoElement

function searchInputChangeHandler(){
  const searchInputValue = searchInput.value.trim().toLowerCase()
  if(searchInputValue !== searchInputOldValue){
    markSearchResults = null
    searchEngineResultsHaveBeenInserted = false
    searchInputOldValue = searchInputValue
    searchRequestPort.postMessage({searchTerms: searchInput.value})
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

  searchEngineResultsHaveBeenInserted = true
  rsoElement = safeGetObjectProperty(
                  Array.from(addedNodes).filter(node => node.tagName.toLowerCase() === 'div')[0],
                  'children.ires.children.rso'
                )
  if(markSearchResults){
    renderMarkSearchResults(markSearchResults, rsoElement)
  }
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
  * The searchInput.value doesn't seem to be available quite yet, so grab search terms
  * from window location hash/query params.
  */
  searchRequestPort.postMessage({searchTerms: getSearchQueryFromUrl()})

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
  }
  else{
    searchEngineResultsHaveBeenInserted = true
    rsoElement = $('#rso')
  }
}

document.addEventListener('DOMContentLoaded', () => getSettings().then(init))

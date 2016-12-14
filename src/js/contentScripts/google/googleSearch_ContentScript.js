import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { isInstantSearch, checkIfInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, getAddedResultNodes } from './googleSearchCSutils'
import { renderMarkSearchResults } from './renderMarkSearchResults'
import { initMSresultsBox } from './setUpMSresultsBox'
import { getSettings, $, safeGetObjectProperty } from '../../utils'

const observerSettings = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
  attributeOldValue: false,
  characterDataOldValue: false
}
let markSearchResults
let searchEngineResults
let searchEngineResultsHaveBeenInserted
let latestInstantSearchRequestId = 0
let rsoElement
let extensionSettings

getSettings().then( settings => {
  extensionSettings = settings
})

/*****
* The first results we get from MarkSearch on page load have a requestId of 0.
*/
function renderMarkSearchResultsIfReady(requestId){
  if(searchEngineResultsHaveBeenInserted && markSearchResults && latestInstantSearchRequestId === requestId){
    console.log('renderMarkSearchResultsIfReady getSearchQueryFromUrl()', getSearchQueryFromUrl())
    renderMarkSearchResults(markSearchResults, rsoElement, searchEngineResults, getSearchQueryFromUrl())
  }
}

function onReceivedMarkSearchResults({searchResults, requestId}){
  console.log('onReceivedMarkSearchResults searchResults', searchResults)
  markSearchResults = searchResults
  renderMarkSearchResultsIfReady(requestId)
}

function mutationObserverHandler(mutations){
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
  searchEngineResultsHaveBeenInserted = true

  renderMarkSearchResultsIfReady()
}

function init(){
  /*****
  * We wanna exit early if it's not a search page or they dont have showOn_____Search results enabled in the extensionSettings.
  */
  if(!extensionSettings.showOnGoogleSearch || !$('#lst-ib')){
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
    */
    const searchRequestPort = chrome.runtime.connect({name: 'googleInstantSearch'})

    searchRequestPort.onMessage.addListener(message => {
      /*****
      * We set the latestInstantSearchRequestId so that we can compare before we call renderMarkSearchResults.
      * This is in case a new instant search is initiated before the results from the previous search has
      * been received from MarkSearch and inserted in to the page.
      */
      if(safeGetObjectProperty(message, 'googleInstantSearchOccured')){
        console.log('googleInstantSearchOccured')
        latestInstantSearchRequestId = message.requestId
        searchEngineResultsHaveBeenInserted = false
        markSearchResults = null
      }
      else{
        console.log('got search results from marksearch from background', message)
        onReceivedMarkSearchResults(message)
      }
    })
    /*****
    * We need a mutation observer for when we need to insert results in to the page - for each new search with
    * instant search, the page removes the old results and inserts the new results. We need to know when
    * the results are inserted so we can insert ours in (for the non MS results box stuff)
    */
    const observer = new MutationObserver(mutationObserverHandler)
    /*****
    * #main is the lowest down element in the tree (of what we want) that's available on DOMContentLoaded.
    */
    observer.observe($('#main'), observerSettings)
  }

  rsoElement = $('#rso')
  
  if(rsoElement){
    searchEngineResults = rsoElement.querySelectorAll('.g:not(#imagebox_bigimages)')
    searchEngineResultsHaveBeenInserted = true
  }

  /*****
  * Do the inital search for the terms on page load.
  * Note: the searchInput.value isn't available quite yet, so grab search terms
  * (and date filter if being used) from window location hash/query params.
  *
  * We send a search request to a background script to do the http request for us because
  * although it is possible to make cross-origin requests in a content script, you need to
  * know ahead of time the url/IP of the server address for the manifest for the extension,
  * and there is no way to know ahead of time what IP address the MarkSearch server will be
  * using, so we cant really give the content script cross-origin permissions.
  * https://developer.chrome.com/extensions/xhr
  *
  * Note: we do a check in the searchMarkSearch.js background script to check if
  * dateFilter.startDate & dateFilter.endDate are not null/undefined
  */
  chrome.runtime.sendMessage(
    {
      searchTerms: getSearchQueryFromUrl(),
      dateFilter: getDateFilterFromUrl()
    }
  )
  chrome.runtime.onMessage.addListener(onReceivedMarkSearchResults)
}

document.addEventListener('DOMContentLoaded', init)

export {
  extensionSettings
}

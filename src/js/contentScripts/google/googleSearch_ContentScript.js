import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import {
  checkIfInstantSearch,
  getSearchQueryFromUrl,
  getDateFilterFromUrl,
  generalResultsPageIsDisplayedForNonInstantSearch,
  checkIfMutationOccuredOnTargetElement,
} from './googleSearchCSutils'
import { renderMarkSearchResultsBoxResults } from '../renderMarkSearchResults'
import {
  setUpMSresultsBoxForGoogle,
  setMSresultsBoxHeight,
  instantSearchToggleMSresultsBoxVisibility,
} from './msResultsBoxForGoogle'
import { setUpMarkSearchSearchButtons } from './msSearchButtonsForGoogle'
import { $ } from '../../utils'
import { getSetting } from '../CS_utils'

const observerSettings = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
  attributeOldValue: false,
  characterDataOldValue: false
}
let marksearchSearchRequestPort
let latestInstantSearchRequestId = 0

/*****
* Note: in our css, we hide the MS results box if the user is on a search page - we do this by using the 'hp' class that
* is applied to the body element when its the search page - our css has a rule to hide the MS results box if the
* body has a class of 'hp'.
*/

function init(){
  /*****
  * We wanna exit early if they dont have <searchEngine>SearchIntegration enabled in the extension settings
  * or if it isn't a google search page - which would mean it doesn't have the google search input (#lst-ib) - this
  * also excludes the Maps and Flights search as they don't have the #lst-ib search input element.
  * Note: we also would not show the MarkSearch search button if <searchEngine>SearchIntegration is false.
  */
  if(!getSetting('googleSearchIntegration') || !$('#lst-ib')){
    return
  }

  const isInstantSearch = checkIfInstantSearch()

  if(getSetting('showMSsearchButton')){
    setUpMarkSearchSearchButtons()
  }
  /*****
  * If it is not instant search and we are on either the search page, or a results page that is not the general
  * results page (e.g. the news search results page), then exit, cause we dont want to show MarkSearch
  * results on the search page, or on other search results pages, only on the general results page (i.e. the "All").
  */
  if(!isInstantSearch && !generalResultsPageIsDisplayedForNonInstantSearch()){
    return
  }

  setUpMSresultsBoxForGoogle(isInstantSearch)

  if(isInstantSearch){
    /*****
    * The webRequest listener in the background sends the content script notifications that an instant search xhr
    * request has occurred and then later it sends the MarkSearch results using the same search
    * terms that were used in the instant search xhr request.
    */
    chrome.runtime.onMessage.addListener(xhrInstantSearchMessageListener)

    const instantSearchMutationObserver = new MutationObserver(instantSearchMutationObserverHandler)
    /*****
    * #main is the lowest down element in the tree (of what we want) that's available on DOMContentLoaded.
    */
    instantSearchMutationObserver.observe($('#main'), observerSettings)

    window.addEventListener('popstate', popstateListener)
  }

  marksearchSearchRequestPort = chrome.runtime.connect({name: 'googleContentScriptRequestMSsearch'})
  /*****
  * Messages back to the marksearchSearchRequestPort port from the background script send back a requestId
  * of 0.
  */
  marksearchSearchRequestPort.onMessage.addListener(onReceivedMarkSearchResults)
  /*****
  * We send a request for a MarkSearch search on page load for both non-instant search and instant search.
  *
  * We do this because sometimes the xhr instant search request isn't sent on page load. This occurs when
  * you click on a result, then click the browser back button to go back to the search - I guess cause it
  * just uses the browser cache, so in that instance, we need to manualy requests a MarkSearch search.
  *
  * Grabbing search terms (and date filter if being used) from window location hash/query params.
  */
  marksearchSearchRequestPort.postMessage(
    {
      searchTerms: getSearchQueryFromUrl(),
      dateFilter: getDateFilterFromUrl()
    }
  )
}
/*****
* The marksearchSearchRequestPort sends messages to the background requesting it to search the MarkSearch
* server and send back the results to the content script. We don't query the MarkSearch server directly
* here in the content script because the MarkSearch server is not https and we would run in to this
* issue: https://bugs.chromium.org/p/chromium/issues/detail?id=421990
*
* The xhrInstantSearchMessageListener recieves the search terms as well as the MarkSearch results from
* the webRequest listener in the background.js. We send back the search terms to xhrInstantSearchMessageListener
* because if the user is on the search page and its instant search, even if they start typing into the search box
* and google starts making instant xhr search requests, the search terms are not added to the url hash until they
* press enter, so we need to grab the search terms in the background webRequest listener and send it here with the
* MarkSearch results.
*
* marksearchSearchRequestPort does not though, so in that case we get it from the url.
*
* We are also checking the requestId in the content script, cause there is a chance
* that a new instant search could happen before we got results from MS and the background script sent
* them back, so check.
*/
function onReceivedMarkSearchResults({searchResults: markSearchResults, requestId, searchTerms}){
  if(latestInstantSearchRequestId === requestId){
    const latestSearchTerms = searchTerms ? searchTerms : getSearchQueryFromUrl()
    renderMarkSearchResultsBoxResults(markSearchResults, latestSearchTerms)
  }
}

function xhrInstantSearchMessageListener({searchResults, requestId, newGoogleInstantSearchOccured, searchTerms}){
  if(newGoogleInstantSearchOccured){
    latestInstantSearchRequestId = requestId
  }
  else if(searchResults){
    onReceivedMarkSearchResults({searchResults, requestId, searchTerms})
  }
}

function instantSearchMutationObserverHandler(mutations){
  const searchElementMutation = checkIfMutationOccuredOnTargetElement(mutations, 'search')
  const searchTypeNavElementMutation = checkIfMutationOccuredOnTargetElement(mutations, 'top_nav')
  /*****
  * If #top_nav is the target of a mutation, then the user may have clicked on the search type navigation to change
  * the search type. If this occurs, we want to hide the MS results box as we don't want it to show if they are searching
  * for news, images etc.
  * #top_nav seems to be the lowest down we can go to get a mutation record for the search nav. I think all the
  * #top_nav child elements are replaced.
  * Notes:
  *   * We cant use the xhr instant search listener because an xhr request isn't called on click if you have
  *   previously clicked on that search for the current search terms - it just uses a cache of the previous results
  *   that is stored somewhere.
  *   * We also cant use the url query params cause they aren't always removed when you click to go back to the 'All'
  *   search.
  *   * We also can't use the popstate listener as that event isn't fired
  *   * Gonna favour using this mutation observer over using a click event listener for the search nav in case the
  *   user is using the keyboard to select that search.
  */
  if(searchElementMutation){
    /*****
    * We re-set the MS results box height here on insertion of new search engine results as new resutls have
    * different snippets (or amount of results), which makes the page height different.
    */
    setMSresultsBoxHeight(searchElementMutation.target)
  }
  if(searchTypeNavElementMutation || searchElementMutation){
    instantSearchToggleMSresultsBoxVisibility()
  }
}

function popstateListener(){
  latestInstantSearchRequestId = 0

  marksearchSearchRequestPort.postMessage(
    {
      searchTerms: getSearchQueryFromUrl(),
      dateFilter: getDateFilterFromUrl()
    }
  )
}

document.addEventListener('DOMContentLoaded', init)

import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { checkIfInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, searchPageIsDisplayed } from './googleSearchCSutils'
import { renderMarkSearchResultsBoxResults } from '../renderMarkSearchResults'
import { showMSresultsBox, hideMSresultsBox } from '../markSearchResultsBox'
import { setUpMSresultsBoxForGoogle, setMSresultsBoxHeightForGoogle } from './setUpMSresultsBoxForGoogle'
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
let searchForm
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

function instantSeachMutationObserverHandler(mutations){
  const mutationRecordWithSearchElemAsTarget = mutations.find(({target: {id}}) => id === 'search')
  if(mutationRecordWithSearchElemAsTarget){
    /*****
    * We re-set the MS results box height here on insertion of new search engine results as new resutls have
    * different snippets (or amount of results), which makes the page height different.
    */
    setMSresultsBoxHeightForGoogle(mutationRecordWithSearchElemAsTarget.target)
    /*****
    * We hide the results box if the user is on a search page (either by regular page load or triggered in the
    * popstateListener by using the back button in the browser), so show it again when there are on the results page.
    */
    showMSresultsBox()
  }
}

function popstateListener(){
  /*****
  * If we go back to the search page, hide the MS results box and dont bother to do a search.
  * Most of the time when the popstate event fires and the user is going back to the search page,
  * the searchForm classes have not yet been changed, so fall back to seeing if getSearchQueryFromUrl()
  * returns null. The hash in the url seems to be changed at this point so I think it should work - it
  * should be null (i.e. no search terms if they are back on the search page).
  */
  const searchQuery = getSearchQueryFromUrl()
  if(searchPageIsDisplayed(searchForm) || !searchQuery){
    hideMSresultsBox()
    return
  }

  showMSresultsBox()

  latestInstantSearchRequestId = 0

  marksearchSearchRequestPort.postMessage(
    {
      searchTerms: searchQuery,
      dateFilter: getDateFilterFromUrl()
    }
  )
}

function init(){
  /*****
  * We wanna exit early if they dont have <searchEngine>SearchIntegration enabled in the extension settings
  * or if it's not a search/results page.
  * Note: we also would not show the MarkSearch search button if <searchEngine>SearchIntegration is false.
  */
  if(!getSetting('googleSearchIntegration') || !$('#lst-ib')){
    return
  }

  searchForm = $('#searchform')
  const isInstantSearch = checkIfInstantSearch()
  const onSearchPage = searchPageIsDisplayed(searchForm)

  if(getSetting('showMSsearchButton')){
    //TODO when i set this up, check that I don't need any of the observers below, if i do, may need to rethink
    //TODO the if(!getSetting('msResultsBox')){ return
    //  setUpMarkSearchSearchButtons(isInstantSearch, onSearchPage)
  }
  /*****
  * If we are on the search page and it is not instant search, exit cause we dont want to show MarkSearch
  * results on the search page, only on the results page.
  */
  if(!isInstantSearch && onSearchPage){
    return
  }

  setUpMSresultsBoxForGoogle(onSearchPage)

  marksearchSearchRequestPort = chrome.runtime.connect({name: 'googleContentScriptRequestMSsearch'})

  if(isInstantSearch){
    /*****
    * The webRequest listener in the background sends the content script notifications that an instant search xhr
    * request has occurred and then later it sends the MarkSearch results using the same search
    * terms that were used in the instant search xhr request.
    */
    chrome.runtime.onMessage.addListener(xhrInstantSearchMessageListener)

    const observer = new MutationObserver(instantSeachMutationObserverHandler)
    /*****
    * #main is the lowest down element in the tree (of what we want) that's available on DOMContentLoaded.
    */
    observer.observe($('#main'), observerSettings)

    window.addEventListener('popstate', popstateListener)
  }
  else{
    /*****
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
  * Messages back to the marksearchSearchRequestPort port from the background script send back a requestId
  * of 0.
  */
  marksearchSearchRequestPort.onMessage.addListener(onReceivedMarkSearchResults)
}

document.addEventListener('DOMContentLoaded', init)

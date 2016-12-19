import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { checkIfInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, searchPageIsDisplayed} from './googleSearchCSutils'
import { renderMarkSearchResultsBoxResults } from './renderMarkSearchResults'
import { setUpMSresultsBox, setMSresultsBoxHeight, showMSresultsBox, hideMSresultsBox } from './markSearchResultsBox'
import { getSettings, $ } from '../../utils'

const observerSettings = {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
  attributeOldValue: false,
  characterDataOldValue: false
}
let extensionSettings
let marksearchSearchRequestPort
let latestInstantSearchRequestId = 0
let searchForm

getSettings().then( settings => {
  extensionSettings = settings
})

function onReceivedMarkSearchResults({searchResults: markSearchResults, requestId}){
  if(latestInstantSearchRequestId === requestId){
    renderMarkSearchResultsBoxResults(markSearchResults, getSearchQueryFromUrl())
  }
}

function xhrInstantSearchMessageListener({searchResults, requestId, newGoogleInstantSearchOccured}){
  if(newGoogleInstantSearchOccured){
    latestInstantSearchRequestId = requestId
  }
  else if(searchResults){
    onReceivedMarkSearchResults({searchResults, requestId})
  }
}

function instantSeachMutationObserverHandler(mutations){
  const mutationRecordWithSearchElemAsTarget = mutations.find(({target: {id}}) => id === 'search')
  if(mutationRecordWithSearchElemAsTarget){
    /*****
    * We re-set the MS results box height here on insertion of new search engine results in case there
    * are only a few results which would mean the page would be shorter.
    */
    setMSresultsBoxHeight(mutationRecordWithSearchElemAsTarget.target)
    /*****
    * We hide the results box if the user is on a search page (either by regular page load or triggered in the
    * popstateListener by using the back button in the browser), so show it again when there are on the results page.
    * showMSresultsBox() does a check to see if the hide class is present.
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
  * We wanna exit early if they dont have <searchEngine>SearchIntegration enabled in the extensionSettings
  * or if it's not a search/results page.
  * Note: we also would not show the MarkSearch search button if <searchEngine>SearchIntegration is false.
  */
  if(!extensionSettings.googleSearchIntegration || !$('#lst-ib')){
    return
  }

  searchForm = $('#searchform')
  const isInstantSearch = checkIfInstantSearch()
  const onSearchPage = searchPageIsDisplayed(searchForm)

  if(extensionSettings.showMSsearchButton){
    //TODO when i set this up, check that I don't need any of the observers below, if i do, may need to rethink
    //TODO the if(!extensionSettings.msResultsBox){ return
    //  setUpMarkSearchSearchButtons(isInstantSearch, onSearchPage)
  }
  /*****
  * If we are on the search page and it is not instant search, exit cause we dont want to show MarkSearch
  * results on the search page, only on the results page.
  */
  if(!isInstantSearch && onSearchPage){
    return
  }
  if(!extensionSettings.msResultsBox){
    return
  }

  setUpMSresultsBox(onSearchPage)

  marksearchSearchRequestPort = chrome.runtime.connect({name: 'googleContentScriptRequestMSsearch'})

  if(isInstantSearch){

    chrome.runtime.onMessage.addListener(xhrInstantSearchMessageListener)

    const observer = new MutationObserver(instantSeachMutationObserverHandler)

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
  * Calls to the marksearchSearchRequestPort port send back a requestId of 0.
  */
  marksearchSearchRequestPort.onMessage.addListener(onReceivedMarkSearchResults)
}

document.addEventListener('DOMContentLoaded', init)

export {
  extensionSettings
}

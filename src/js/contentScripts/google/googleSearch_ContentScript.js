import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { isInstantSearch, checkIfInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl } from './googleSearchCSutils'
import { renderMarkSearchResultsBoxResults } from './renderMarkSearchResults'
import { setUpMSresultsBox, setMSresultsBoxHeight } from './setUpMSresultsBox'
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

getSettings().then( settings => {
  extensionSettings = settings
})

function onReceivedMarkSearchResults({searchResults: markSearchResults, requestId}){
  console.log('onReceivedMarkSearchResults')
  console.log('onReceivedMarkSearchResults markSearchResults: ', markSearchResults)
  console.log('onReceivedMarkSearchResults requestId: ', requestId)
  if(latestInstantSearchRequestId === requestId){
    renderMarkSearchResultsBoxResults(markSearchResults, getSearchQueryFromUrl())
  }
}

function xhrInstantSearchMessageListener({searchResults, requestId, newGoogleInstantSearchOccured}){
  console.log('xhrInstantSearchMessageListener newGoogleInstantSearchOccured: ', newGoogleInstantSearchOccured)
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

function init(){
  /*****
  * We wanna exit early if they dont have showOn_____Search or msResultsBox enabled in the extensionSettings
  * or if it's not a search page.
  */
  if(!extensionSettings.showOnGoogleSearch || !extensionSettings.msResultsBox || !$('#lst-ib')){
    return
  }

  checkIfInstantSearch()

  setUpMSresultsBox()

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

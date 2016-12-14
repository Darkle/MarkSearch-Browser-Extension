import '../../../nonInlineStyles/googleSearch_ContentScript.styl'
import { isInstantSearch, checkIfInstantSearch, getSearchQueryFromUrl, getDateFilterFromUrl, parseDateFilter, getAddedResultNodes } from './googleSearchCSutils'
import { renderMarkSearchResults } from './renderMarkSearchResults'
import { initMSresultsBox } from './setUpMSresultsBox'
import { getSettings, $ } from '../../utils'

let extensionSettings

getSettings().then( settings => {
  extensionSettings = settings
})

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

    const observer = new MutationObserver(mutationObserverHandler)

    observer.observe($('#main'), observerSettings)
    window.addEventListener('popstate', () => {
      console.log('popstate getSearchQueryFromUrl()', getSearchQueryFromUrl())
      sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), getDateFilterFromUrl())
    })
  }
  else{
    searchEngineResultsHaveBeenInserted = true
    rsoElement = $('#rso')
    searchEngineResults = rsoElement.querySelectorAll('.g:not(#imagebox_bigimages)')
  }

  searchRequestPort = chrome.runtime.connect({name: 'contentScriptPageLoadSearchRequest'})
  searchRequestPort.onMessage.addListener(onReceivedMarkSearchResults)

  sendSearchRequestToMarkSearch(getSearchQueryFromUrl(), getDateFilterFromUrl())
}

document.addEventListener('DOMContentLoaded', init)

export {
  extensionSettings
}

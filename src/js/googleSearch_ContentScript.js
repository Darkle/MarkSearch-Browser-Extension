
import debounce from 'lodash.debounce'
import trim from 'lodash.trim'

import '../styles/googleSearch_ContentScript.styl'
import { getSettings, $ } from './utils'

const searchInput = $('#lst-ib')
let searchRequestPort
let msResultsContainer
let firstRun = true
let searchInputOldValue

function createMarkSearchResultsDom(searchResults){
  console.log('createMarkSearchResultsDom', searchResults)
  /*****
  * Create the results container on first run or clear it.
  */
  if(firstRun){
    msResultsContainer = document.createElement('div')
    msResultsContainer.setAttribute('id', 'marksearchResultsContainer')
  }
  if(!firstRun){
    msResultsContainer.innerHTML = ''
  }

  // for(let i = 0, len = searchResults.length; i < len; i++){
  //   const result = searchResults[i]
  //
  // }

  /*****
  * Delaying the append to make it more efficient. We want to create all the result elems and append them
  * to the msResultsContainer before we append it to the page.
  */
  if(firstRun){
    firstRun = false
    document.body.appendChild(msResultsContainer)
  }
}

function searchInputChangeHandler(){
  const searchInputValue = trim(searchInput.value).toLowerCase()
  if(searchInputValue !== searchInputOldValue){
    searchInputOldValue = searchInputValue
    searchRequestPort.postMessage({searchTerms: searchInput.value})
  }
}

function initGoogleSearchIntegration(settings){
  if(!settings.integrateWithGoogleSearch){
    return
  }
  searchRequestPort = chrome.runtime.connect({name: 'contentScriptSearchRequest'})
  // const optionsPagePort = chrome.runtime.connect({name: 'openOptionsPage'})
  const debounceTime = 200
  searchInputOldValue = searchInput.value.toLowerCase()


  searchRequestPort.onMessage.addListener( searchResults => {
    if(!Array.isArray(searchResults) || !searchResults.length){
      return
    }
    createMarkSearchResultsDom(searchResults)
  })

  searchRequestPort.postMessage({searchTerms: searchInput.value})

  const debouncedSearchInputChangeHandler = debounce(
    searchInputChangeHandler,
    debounceTime,
    {
      'leading': false,
      'trailing': true
    }
  )

  searchInput.addEventListener('input', debouncedSearchInputChangeHandler)
  searchInput.addEventListener('change', debouncedSearchInputChangeHandler)
}

getSettings().then(initGoogleSearchIntegration)

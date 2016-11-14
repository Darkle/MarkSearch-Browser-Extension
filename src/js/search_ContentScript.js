import '../styles/search_ContentScript.styl'

const port = chrome.runtime.connect({name: 'contentScriptSearchRequest'})
port.postMessage({searchTerms: 'alcaszeltzer'})

port.onMessage.addListener( searchResults => {
  if(!Array.isArray(searchResults) || !searchResults.length){
    return
  }
  console.log('the search was successfull on the backend of extension')
  console.log('searchResults', searchResults)
})

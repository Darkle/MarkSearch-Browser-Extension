// import '../styles/search_ContentScript.styl'

// alert('content script!')
console.log('Content script js running')

const port = chrome.runtime.connect({name: 'contentScriptSearchRequest'})
port.postMessage({searchTerms: 'hacker news'})

port.onMessage.addListener( searchResults => {
  console.log('the search was successfull on the backend of extension')
  console.log('searchResults', searchResults)
})

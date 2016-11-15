// import '../styles/bingSearch_ContentScript.styl'
// import { getSettings } from './utils'
//
// function initBingSearchIntegration(settings){
//   if(!settings.integrateWithBingSearch){
//     return
//   }
//   const searchRequestPort = chrome.runtime.connect({name: 'contentScriptSearchRequest'})
//   const optionsPagePort = chrome.runtime.connect({name: 'openOptionsPage'})
//
//   searchRequestPort.onMessage.addListener( searchResults => {
//     if(!Array.isArray(searchResults) || !searchResults.length){
//       return
//     }
//     console.log('searchRequestPort.onMessage')
//     console.log('searchResults', searchResults)
//   })
//
//
//
//   // searchRequestPort.postMessage({searchTerms: 'hacker news'})
//
//   // optionsPagePort.postMessage({})
// }
//
// getSettings().then(initBingSearchIntegration)

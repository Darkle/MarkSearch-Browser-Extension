// import '../styles/baiduSearch_ContentScript.styl'
// import { getSettings } from './utils'
//
// function initBaiduSearchIntegration(settings){
//   if(!settings.showOnBaiduSearch){
//     return
//   }
//   const searchRequestPort = chrome.runtime.connect({name: 'contentScriptSearchRequest'})
//   const optionsPagePort = chrome.runtime.connect({name: 'openOptionsPage'})
//
//   searchRequestPort.onMessage.addListener( searchResults => {
//     if(!Array.isArray(searchResults) || !searchResults.length){
//       return
//     }
//   })
//
//
//
//   // searchRequestPort.postMessage({searchTerms: 'hacker news'})
//
//   // optionsPagePort.postMessage({})
// }
//
// getSettings().then(initBaiduSearchIntegration)

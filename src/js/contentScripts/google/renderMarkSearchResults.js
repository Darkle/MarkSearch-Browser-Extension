
// import { extensionSettings, msResultsBoxElem } from './googleSearch_ContentScript'
/*
archiveLink: "https://archive.is/qHKPe"
dateCreated: 1469506666578
pageDescription: "The Age has the latest local news on Melbourne, Victoria. Read National News from Australia, World News, Business News and Breaking News stories."
pageDomain: "com.au"
pageTitle: "Latest &amp; Breaking News Melbourne, Victoria | The Age"
pageUrl: "http://www.theage.com.au/"
rank:-8.023295618319
safeBrowsing: null
snippet:"...CARS F
 */
function renderMarkSearchResults(searchResults, rsoElement){
  console.log('renderMarkSearchResults', searchResults)
  console.log('rsoElement', rsoElement)
  // if(extensionSettings.msResultsBox){
  //   msResultsBoxElem.innerHTML = ''
  //   const msResultsBoxDocFragment = document.createDocumentFragment()
  //   searchResults.forEach(result => {
  //     const resultLink = document.createElement('a')
  //
  //     msResultsBoxDocFragment.appendChild()
  //   })
  //   msResultsBoxElem.appendChild(msResultsBoxDocFragment)
  // }
  // for(let i = 0, len = searchResults.length; i < len; i++){
  //   const result = searchResults[i]
  //
  // }
}

// function removeMarkSearchResults(){
//   //NOTE may not need to remove the MS results that are above/intersperesed/below the search engine
//   //results as the search engine results container div might be removed by google
// }

export {
  renderMarkSearchResults,
  // removeMarkSearchResults
}

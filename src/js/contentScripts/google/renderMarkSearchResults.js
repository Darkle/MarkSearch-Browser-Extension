
import validator from 'validator'

import { extensionSettings, msResultsBoxElem } from './googleSearch_ContentScript'
import { $$ } from '../../utils'
/*
archiveLink: "https://archive.is/qHKPe"
dateCreated: 1469506666578
pageDescription: "The Age has the latest local news on Melbourne, Victoria. Read National News from Australia, World News, Business News and Breaking News stories."
pageDomain: "theage.com.au"
pageTitle: "Latest &amp; Breaking News Melbourne, Victoria | The Age"
pageUrl: "http://www.theage.com.au/"
rank:-8.023295618319
safeBrowsing: null
snippet:"...CARS F
 */

function insertLinkElem(pageUrl, rel){
  const link = document.createElement('link')
  link.setAttribute('class', 'prebrowsing')
  link.setAttribute('href', pageUrl)
  link.setAttribute('rel', rel)
  document.head.appendChild(link)
}

function renderMarkSearchResults(searchResults, rsoElement){
  console.log('renderMarkSearchResults', searchResults)
  console.log('rsoElement', rsoElement)
  if(!searchResults.length){
    return
  }
  if(extensionSettings.msResultsPrebrowsing){
    for(const linkPreBrowsElem of $$('link.prebrowsing')){
      linkPreBrowsElem.remove()
    }
    insertLinkElem(searchResults[0].pageUrl, 'preconnect')
    /*****
    * The first result is always there cause of !searchResults.length, but need to check
    * if second one is there.
    */
    if(searchResults[1]){
      insertLinkElem(searchResults[1].pageUrl, 'dns-prefetch')
    }
  }
  if(extensionSettings.msResultsBox){
    msResultsBoxElem.innerHTML = ''

    const msResultsBoxDocFragment = document.createDocumentFragment()
    const resultsAmountDiv = document.createElement('div')
    resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
    resultsAmountDiv.textContent = `${ searchResults.length } Results`
    msResultsBoxDocFragment.appendChild(resultsAmountDiv)

    const tempResults = Array(500).fill(searchResults[0])


    tempResults.forEach(({pageTitle, pageUrl}, index) => {
      const resultDiv = document.createElement('div')
      resultDiv.setAttribute('id', `marksearchResultsBoxResult_${ index + 1 }`)
      resultDiv.setAttribute('class', 'marksearchResultsBoxResult')
      msResultsBoxDocFragment.appendChild(resultDiv)

      const mainDetails = document.createElement('div')
      mainDetails.className = 'mainDetails'
      resultDiv.appendChild(mainDetails)

      const mainResultLink = document.createElement('div')
      mainResultLink.className = 'mainResultLink'
      mainDetails.appendChild(mainResultLink)

      const resultLink = document.createElement('a')
      resultLink.setAttribute('href', pageUrl)
      /*****
       * If there's no pageTitle text, then just use the page url
       */
      let resultLinkTextContent = pageUrl
      if(pageTitle && pageTitle.length && pageTitle.trim().length > 0){
        resultLinkTextContent = pageTitle.trim()
      }
      /****
       * unescape should be ok here as we are using textContent and not innerHTML
       */
      resultLink.textContent = validator.unescape(resultLinkTextContent)
      mainResultLink.appendChild(resultLink)

      const resultUrlText = document.createElement('div')
      resultUrlText.className = 'resultUrlText'
      resultUrlText.textContent = pageUrl
      mainDetails.appendChild(resultUrlText)
    })

    msResultsBoxElem.appendChild(msResultsBoxDocFragment)
  }
  // for(let i = 0, len = searchResults.length; i < len; i++){
  //   const result = searchResults[i]
  //   use a document fragment here as well for these bits
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

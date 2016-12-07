import { default as validatorUnescape } from 'validator/lib/unescape'

import { extensionSettings, msResultsBoxResultsContainer } from './googleSearch_ContentScript'
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
 // */

function calculateEndResultNumber(){
  let endResultNumberToShowAtTop = 0
  let endResultNumberToIntersperse = 0
  let endResultNumberToShowAtBottom = 0

  if(extensionSettings.msResultsAtTop){
    endResultNumberToShowAtTop = extensionSettings.msResultsAtTop_numberOfResultsToShow
  }
  if(extensionSettings.msResultsInterspersed){
    endResultNumberToIntersperse = endResultNumberToShowAtTop +
                                    extensionSettings.msResultsInterspersed_numberOfResultsToShow
  }
  if(extensionSettings.msResultsAtBottom){
    endResultNumberToShowAtBottom = endResultNumberToShowAtTop +
                                      endResultNumberToIntersperse +
                                      extensionSettings.msResultsAtBottom_numberOfResultsToShow
  }
  return [endResultNumberToShowAtTop, endResultNumberToIntersperse, endResultNumberToShowAtBottom]
}

function insertLinkElem(pageUrl, rel){
  const link = document.createElement('link')
  link.setAttribute('class', 'prebrowsing')
  link.setAttribute('href', pageUrl)
  link.setAttribute('rel', rel)
  document.head.appendChild(link)
}

function createMSresultElements(pageUrl, pageTitle, index){
  const resultDiv = document.createElement('div')
  resultDiv.setAttribute('id', `marksearchResultsBoxResult_${ index + 1 }`)
  resultDiv.setAttribute('class', 'marksearchResultsBoxResult')

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
  if(typeof pageTitle === 'string'){
    const pageTitleTrimmed = pageTitle.trim()
    if(pageTitleTrimmed.length > 0){
      resultLinkTextContent = pageTitleTrimmed
    }
  }
  /****
   * unescape should be ok here as we are using textContent and not innerHTML
   */
  resultLink.textContent = validatorUnescape(resultLinkTextContent)
  mainResultLink.appendChild(resultLink)

  const resultUrlText = document.createElement('div')
  resultUrlText.className = 'resultUrlText'
  resultUrlText.textContent = pageUrl
  mainDetails.appendChild(resultUrlText)

  return resultDiv
}

function renderMarkSearchResults(searchResults, rsoElement, searchEngineResults){
  console.log('renderMarkSearchResults', searchResults)
  console.log('rsoElement', rsoElement)
  console.log('searchEngineResults', searchEngineResults)
  console.log('searchEngineResults.length', searchEngineResults.length)

  const [
    endResultNumberToShowAtTop,
    endResultNumberToIntersperse,
    endResultNumberToShowAtBottom
  ] = calculateEndResultNumber()
  let msResultsBoxDocFragment
  let topResultsContainer
  let bottomResultsContainer

  if(extensionSettings.msResultsPrebrowsing){
    for(const linkPreBrowsElem of $$('link.prebrowsing')){
      linkPreBrowsElem.remove()
    }
    if(searchResults[0]){
      insertLinkElem(searchResults[0].pageUrl, 'preconnect')
    }
    if(searchResults[1]){
      insertLinkElem(searchResults[1].pageUrl, 'dns-prefetch')
    }
  }
  if(extensionSettings.msResultsBox){
    // for(const msResultsBoxResult of $$('#msResultsBox .marksearchResultsBoxResult')){
    //   msResultsBoxResult.remove()
    // }
    msResultsBoxResultsContainer.innerHTML = ''

    msResultsBoxDocFragment = document.createDocumentFragment()
    const resultsAmountDiv = document.createElement('div')
    resultsAmountDiv.setAttribute('id', 'resultsBoxCount')
    resultsAmountDiv.textContent = `${ searchResults.length } Results`
    msResultsBoxDocFragment.appendChild(resultsAmountDiv)
  }
  /*****
  * Not using a document fragment for top and bottom integrated results as we would be inserting
  * the fragments after the interspersed MarkSearch results had been inserted into the page, which
  * would probably not look as good because you would see them appear slightly later than the
  * interspersed ones.
  */
  if(extensionSettings.msResultsAtTop){
    topResultsContainer = document.createElement('div')
    topResultsContainer.setAttribute('id', 'markSearchTopResultsContainer')
    rsoElement.insertBefore(topResultsContainer, rsoElement.firstElementChild)
  }
  if(extensionSettings.msResultsAtBottom){
    bottomResultsContainer = document.createElement('div')
    bottomResultsContainer.setAttribute('id', 'markSearchBottomResultsContainer')
    rsoElement.appendChild(bottomResultsContainer)
  }
  let tempResults = []
  if(searchResults[0]){
    tempResults = Array(500).fill(searchResults[0])
  }

  let interspersedNodeToInsertAfter = 0

  tempResults.forEach(({pageTitle, pageUrl}, index) => {
    const resultDiv = createMSresultElements(pageUrl, pageTitle, index)
    const resultNumber = index + 1

    if(extensionSettings.msResultsBox){
      msResultsBoxDocFragment.appendChild(resultDiv)
    }
    if(extensionSettings.msResultsAtTop && resultNumber <= endResultNumberToShowAtTop){
      topResultsContainer.appendChild(resultDiv)
    }
    if(extensionSettings.msResultsInterspersed &&
        resultNumber > endResultNumberToShowAtTop &&
        resultNumber <= endResultNumberToIntersperse &&
        interspersedNodeToInsertAfter <= (searchEngineResults.length -1) ){
      /*****
      * we start inserting interspersed at the first searchEngineResults (0)
      */
      searchEngineResults[interspersedNodeToInsertAfter].after(resultDiv)
      interspersedNodeToInsertAfter = interspersedNodeToInsertAfter + 1
    }
    /*****
    * endResultNumberToIntersperse is endResultNumberToShowAtTop + endResultNumberToIntersperse.
    * Note: we need the endResultNumberToShowAtBottom, because we dont want all of the rest of the results to be
    * shown, just how many the user specified for showing at the bottom.
    */
    if(extensionSettings.msResultsAtBottom &&
        resultNumber > endResultNumberToIntersperse &&
        resultNumber <= endResultNumberToShowAtBottom){
      bottomResultsContainer.appendChild(resultDiv)
    }
  })

  if(extensionSettings.msResultsBox){
    msResultsBoxResultsContainer.appendChild(msResultsBoxDocFragment)
  }
}

// function removeMarkSearchResults(){
//   //NOTE may not need to remove the MS results that are above/intersperesed/below the search engine
//   //results as the search engine results container div might be removed by google
// }

export {
  renderMarkSearchResults,
  // removeMarkSearchResults
}
